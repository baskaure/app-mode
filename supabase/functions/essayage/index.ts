// Edge Function : essayage d'un vêtement sur la photo de soi, par OpenAI (gpt-image-2.5-sunburst, choisi le 12 oct. 2026).
//   POST { action: 'lancer', essai_id } → vérifie, réserve le quota, puis génère l'image en tâche de fond
//     (EdgeRuntime.waitUntil : une image peut prendre jusqu'à 2 minutes) ; l'essai passe « en_cours ».
//   POST { action: 'suivre', essai_id } → lit l'état de l'essai (l'app interroge toutes les 3 s).
// Avant la génération, moderation.ts refuse lingerie, maillots, transparence et nudité (statut « refuse »).
// Après, l'image produite est vérifiée à son tour : refusée, elle n'est ni enregistrée ni affichée.
// Les clés OPENAI_API_KEY et ANTHROPIC_API_KEY sont des secrets Supabase : elles ne quittent jamais le serveur.
// Lectures avec le JWT de l'utilisateur (RLS) ; écritures des colonnes serveur avec service_role (migration 000005).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { type Image, verifierImages, verifierResultat } from './moderation.ts';
import {
  CONSIGNE_ESSAYAGE,
  depuisBase64,
  essaiAbandonne,
  estimerCoutUsd,
  lireReponse,
  MODELE_IMAGE,
  type ResultatImage,
  TAILLE_IMAGE,
} from './openai-reponse.ts';
import { MESSAGE_RESULTAT_REFUSE } from './regles.ts';
import { droitActif, type Quota, verifierQuota } from './quota.ts';

// Tâches de fond des Edge Functions (https://supabase.com/docs/guides/functions/background-tasks).
declare const EdgeRuntime: { waitUntil(tache: Promise<unknown>): void };

const OPENAI_EDITS = 'https://api.openai.com/v1/images/edits';
// Qualité de l'image (low, medium, high…) : elle fixe surtout le coût. Réglable sans redéployer.
const QUALITE = Deno.env.get('ESSAI_QUALITE') ?? 'medium';
// Au-delà, on abandonne : le worker gratuit s'arrête à 150 s (vérifications comprises).
const DELAI_OPENAI_MS = 120_000;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
// Plafond d'essayages par abonné et par mois (budget : environ 1 € de génération par abonné et par mois).
const MAX_PAR_MOIS = Number(Deno.env.get('ESSAIS_MAX_PAR_MOIS') ?? '30');
// Essayages offerts sans abonnement, au total (le « moment waouh » avant le paywall).
const ESSAIS_GRATUITS = Number(Deno.env.get('ESSAIS_GRATUITS') ?? '1');
// Essayages offerts par jour, tous comptes confondus : borne le coût si quelqu'un recrée des comptes anonymes.
const ESSAIS_GRATUITS_JOUR = Number(Deno.env.get('ESSAIS_GRATUITS_JOUR') ?? '50');
// Droit d'accès RevenueCat qui ouvre l'abonnement (identifiant de l'« entitlement » dans le tableau de bord).
const DROIT_ABONNEMENT = Deno.env.get('REVENUECAT_ENTITLEMENT') ?? 'premium';

function reponse(statut: number, corps: Record<string, unknown>) {
  return new Response(JSON.stringify(corps), { status: statut, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

// Une seule requête : la personne (image 1) et le vêtement (image 2), tels qu'ils ont été vérifiés.
async function genererImage(personne: Image, vetement: Image): Promise<ResultatImage> {
  const cle = Deno.env.get('OPENAI_API_KEY');
  if (!cle) throw new Error('cle_absente');
  const formulaire = new FormData();
  formulaire.append('model', MODELE_IMAGE);
  formulaire.append('prompt', CONSIGNE_ESSAYAGE);
  formulaire.append('image[]', new Blob([new Uint8Array(personne.octets)], { type: personne.type }), 'personne');
  formulaire.append('image[]', new Blob([new Uint8Array(vetement.octets)], { type: vetement.type }), 'vetement');
  formulaire.append('size', TAILLE_IMAGE);
  formulaire.append('quality', QUALITE);
  formulaire.append('output_format', 'jpeg');
  formulaire.append('n', '1');
  const res = await fetch(OPENAI_EDITS, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cle}` },
    body: formulaire,
    signal: AbortSignal.timeout(DELAI_OPENAI_MS),
  });
  const corps = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`openai:${corps?.error?.message ?? res.status}`);
  return lireReponse(corps);
}

const TYPES_IMAGE = ['image/jpeg', 'image/png', 'image/webp'] as const;

// Lit l'image avec le JWT de l'utilisateur (donc seulement ses fichiers). Les mêmes octets, gardés en mémoire,
// passent à la vérification puis à OpenAI : rien ne peut être remplacé entre les deux, et aucune copie n'est stockée.
async function lireImage(supabase: SupabaseClient, bucket: string, chemin: string): Promise<Image> {
  const { data, error } = await supabase.storage.from(bucket).download(chemin);
  if (error || !data) throw new Error(`Image introuvable : ${error?.message}`);
  const type = (data.type || 'image/jpeg').split(';')[0].trim() as Image['type'];
  if (!TYPES_IMAGE.includes(type)) throw new Error('Format d’image non pris en charge.');
  return { octets: new Uint8Array(await data.arrayBuffer()), type };
}

function debutDuJour() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function debutDuMois() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

// Compte les essayages du journal : les siens (ce mois-ci, au total) et les offerts du jour, tous comptes confondus.
// Une lecture ratée compte comme « plafond atteint ».
async function compterEssayages(admin: SupabaseClient, uid: string) {
  const compter = async (filtre: { uid?: string; depuis?: string; gratuit?: boolean }) => {
    let requete = admin.from('essayages_journal').select('id', { count: 'exact', head: true });
    if (filtre.uid) requete = requete.eq('user_id', filtre.uid);
    if (filtre.depuis) requete = requete.gte('created_at', filtre.depuis);
    if (filtre.gratuit) requete = requete.eq('gratuit', true);
    const { count, error } = await requete;
    return error || count === null ? Number.POSITIVE_INFINITY : count;
  };
  const [ceMois, total, offertsAujourdhui] = await Promise.all([
    compter({ uid, depuis: debutDuMois() }),
    compter({ uid }),
    compter({ depuis: debutDuJour(), gratuit: true }),
  ]);
  return { ceMois, total, offertsAujourdhui };
}

// L'app ne dit pas elle-même si on est abonné : on le demande à RevenueCat avec la clé secrète.
// Sans clé (pas encore branché), personne n'est abonné : seuls les essayages offerts passent.
async function estAbonne(uid: string): Promise<boolean> {
  const cle = Deno.env.get('REVENUECAT_SECRET_KEY');
  if (!cle) return false;
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
    headers: { Authorization: `Bearer ${cle}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`abonnement:${res.status}`);
  const corps = await res.json().catch(() => null);
  return droitActif(corps?.subscriber?.entitlements?.[DROIT_ABONNEMENT], new Date());
}

function refusQuota(quota: Exclude<Quota, { ok: true }>) {
  if (quota.code === 'abonnement') {
    return reponse(402, { erreur: 'Ton essayage offert est utilisé. Abonne-toi pour continuer.', code: 'abonnement' });
  }
  if (quota.code === 'offerts_du_jour') {
    return reponse(402, {
      erreur: 'Les essayages offerts du jour sont tous partis. Reviens demain, ou abonne-toi pour essayer tout de suite.',
      code: 'abonnement',
    });
  }
  return reponse(429, { erreur: `Tu as atteint ${MAX_PAR_MOIS} essayages ce mois-ci.`, code: 'plafond' });
}

async function lancer(supabase: SupabaseClient, admin: SupabaseClient, uid: string, essaiId: string) {
  const { data: essai, error } = await supabase
    .from('essais')
    .select('id, statut, vetement_bucket, vetement_path')
    .eq('id', essaiId)
    .single();
  if (error || !essai) return reponse(404, { erreur: 'Essai introuvable.' });
  if (essai.statut === 'en_cours' || essai.statut === 'fait') return reponse(200, { statut: essai.statut });
  // Sans clé OpenAI, inutile de payer la vérification.
  if (!Deno.env.get('OPENAI_API_KEY')) throw new Error('cle_absente');

  const { data: profil } = await supabase
    .from('profils')
    .select('photo_soi_path, consentement_photo_at')
    .eq('id', uid)
    .single();
  if (!profil?.photo_soi_path || !profil.consentement_photo_at) {
    return reponse(400, { erreur: 'Ajoute d’abord une photo de toi.' });
  }

  // Droit à un essayage (offert ou abonnement) : on s'arrête avant de payer la vérification.
  const abonne = await estAbonne(uid);
  const quotaAvant = verifierQuota({
    abonne,
    ...(await compterEssayages(admin, uid)),
    maxParMois: MAX_PAR_MOIS,
    gratuits: ESSAIS_GRATUITS,
    maxOffertsJour: ESSAIS_GRATUITS_JOUR,
    inclus: false,
  });
  if (!quotaAvant.ok) return refusQuota(quotaAvant);

  // Réservation atomique : deux appels simultanés ne lancent qu'un seul essayage.
  // Un essai refusé est revérifié : la personne a pu changer sa photo de soi entre-temps.
  const { data: reserve } = await admin
    .from('essais')
    .update({ statut: 'en_cours', message: null, lance_at: new Date().toISOString() })
    .eq('id', essai.id)
    .eq('user_id', uid)
    .in('statut', ['a_faire', 'refuse', 'erreur'])
    .select('id');
  if (!reserve?.length) return reponse(200, { statut: 'en_cours' });

  const remettre = (statut: string, message: string | null) =>
    admin.from('essais').update({ statut, message }).eq('id', essai.id);

  try {
    const vetement = await lireImage(supabase, essai.vetement_bucket, essai.vetement_path);
    const personne = await lireImage(supabase, 'silhouettes', profil.photo_soi_path);

    const decision = await verifierImages(vetement, personne);
    if (!decision.autorise) {
      await remettre('refuse', decision.message);
      return reponse(200, { statut: 'refuse', message: decision.message });
    }

    // Quota : on réserve une ligne du journal, puis on recompte (y compris les réservations en parallèle).
    const { data: ligne, error: erreurJournal } = await admin
      .from('essayages_journal')
      .insert({ user_id: uid, essai_id: essai.id, gratuit: !abonne })
      .select('id')
      .single();
    if (erreurJournal || !ligne) throw new Error(`Journal indisponible : ${erreurJournal?.message}`);
    const quotaApres = verifierQuota({
      abonne,
      ...(await compterEssayages(admin, uid)),
      maxParMois: MAX_PAR_MOIS,
      gratuits: ESSAIS_GRATUITS,
      maxOffertsJour: ESSAIS_GRATUITS_JOUR,
      inclus: true,
    });
    if (!quotaApres.ok) {
      await admin.from('essayages_journal').delete().eq('id', ligne.id);
      await remettre('a_faire', null);
      return refusQuota(quotaApres);
    }

    // La génération continue après la réponse : l'app suit l'avancement avec « suivre ».
    EdgeRuntime.waitUntil(generer(admin, uid, essai.id, ligne.id, personne, vetement));
    return reponse(200, { statut: 'en_cours' });
  } catch (e) {
    await remettre('erreur', 'L’essayage n’a pas pu démarrer.');
    throw e;
  }
}

// Tâche de fond : génère, vérifie et enregistre l'image. Ne lève jamais : tout échec finit en statut d'essai.
async function generer(
  admin: SupabaseClient,
  uid: string,
  essaiId: string,
  ligneJournal: string,
  personne: Image,
  vetement: Image,
) {
  const finir = (statut: string, champs: Record<string, unknown>) =>
    admin.from('essais').update({ statut, ...champs }).eq('id', essaiId).eq('statut', 'en_cours');

  let resultat: ResultatImage;
  try {
    resultat = await genererImage(personne, vetement);
  } catch (e) {
    // Pas d'image produite : l'essai ne compte pas dans le plafond.
    const detail = e instanceof Error ? e.message : String(e);
    console.error('essayage: génération échouée', detail);
    await admin.from('essayages_journal').delete().eq('id', ligneJournal);
    await finir('erreur', {
      message: 'L’IA n’a pas pu créer l’image. Réessaie dans un instant.',
      erreur_technique: detail.slice(0, 500),
    });
    return;
  }

  try {
    // Coût réel de chaque image, pour vérifier le budget (environ 1 € par abonné et par mois).
    await admin
      .from('essayages_journal')
      .update({ usage: resultat.usage ?? null, cout_usd: estimerCoutUsd(resultat.usage) })
      .eq('id', ligneJournal);

    // Image refusée : rien n'est enregistré ni montré. L'essayage reste décompté (OpenAI l'a facturé) :
    // sinon, provoquer des refus ferait générer des images à nos frais.
    const image: Image = { octets: depuisBase64(resultat.base64), type: 'image/jpeg' };
    if (!(await verifierResultat(image))) {
      await finir('refuse', { message: MESSAGE_RESULTAT_REFUSE });
      return;
    }
    const chemin = `${uid}/${essaiId}.jpg`;
    const envoi = await admin.storage
      .from('essayages')
      .upload(chemin, image.octets, { contentType: image.type, upsert: true });
    if (envoi.error) throw new Error(`Copie du résultat impossible : ${envoi.error.message}`);
    await finir('fait', { resultat_path: chemin, message: null, erreur_technique: null });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error('essayage: fin échouée', detail);
    await finir('erreur', { message: 'L’essayage a échoué.', erreur_technique: detail.slice(0, 500) });
  }
}

async function suivre(supabase: SupabaseClient, admin: SupabaseClient, essaiId: string) {
  const { data: essai, error } = await supabase
    .from('essais')
    .select('id, statut, lance_at, resultat_path, message')
    .eq('id', essaiId)
    .single();
  if (error || !essai) return reponse(404, { erreur: 'Essai introuvable.' });

  // Tâche de fond arrêtée en route (plafond de durée du worker) : on libère l'essai et on rend l'essayage.
  if (essai.statut === 'en_cours' && essaiAbandonne(essai.lance_at, new Date())) {
    const message = 'L’essayage a pris trop de temps. Réessaie.';
    const { data: libere } = await admin
      .from('essais')
      .update({ statut: 'erreur', message })
      .eq('id', essai.id)
      .eq('statut', 'en_cours')
      .select('id');
    if (libere?.length) {
      await admin.from('essayages_journal').delete().eq('essai_id', essai.id).gte('created_at', essai.lance_at);
    }
    return reponse(200, { statut: 'erreur', message });
  }
  return reponse(200, { statut: essai.statut, resultat_path: essai.resultat_path, message: essai.message });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reponse(405, { erreur: 'Méthode non autorisée.' });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: utilisateur } = await supabase.auth.getUser();
  if (!utilisateur.user) return reponse(401, { erreur: 'Session invalide.' });
  // Client serveur : seul à pouvoir écrire statut, résultat et journal.
  // Chaque lecture des données de l'utilisateur passe d'abord par `supabase` (son JWT, règles RLS).
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  let action: string;
  let essaiId: string;
  try {
    ({ action, essai_id: essaiId } = await req.json());
  } catch {
    return reponse(400, { erreur: 'Requête invalide.' });
  }
  if (typeof essaiId !== 'string') return reponse(400, { erreur: 'Essai manquant.' });

  try {
    if (action === 'lancer') return await lancer(supabase, admin, utilisateur.user.id, essaiId);
    if (action === 'suivre') return await suivre(supabase, admin, essaiId);
    return reponse(400, { erreur: 'Action inconnue.' });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'cle_absente') {
      return reponse(503, { erreur: 'L’essayage n’est pas encore activé (clé OpenAI manquante).' });
    }
    if (message === 'moderation_cle_absente') {
      return reponse(503, { erreur: 'L’essayage n’est pas encore activé (clé de vérification manquante).' });
    }
    if (message.startsWith('moderation:')) {
      return reponse(502, { erreur: 'La vérification du vêtement n’a pas pu se faire. Réessaie dans un instant.' });
    }
    if (message.startsWith('abonnement:')) {
      return reponse(502, { erreur: 'Vérification de l’abonnement impossible. Réessaie dans un instant.' });
    }
    return reponse(500, { erreur: message });
  }
});
