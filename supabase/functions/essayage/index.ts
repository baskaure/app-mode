// Edge Function : essayage d'un vêtement sur la photo de soi, par GPT Image 2.5 (sunburst) via Kie.ai.
// Choisi le 12 oct. 2026 ; Kie.ai revend l'accès au modèle d'OpenAI (voir kie.ts pour la doc).
//   POST { action: 'lancer', essai_id } → vérifie, réserve le quota, crée la tâche Kie ; l'essai passe « en_cours ».
//   POST { action: 'suivre', essai_id } → interroge Kie ; si c'est fini, vérifie l'image et la copie dans `essayages`.
// Avant la génération, moderation.ts refuse lingerie, maillots, transparence et nudité (statut « refuse »).
// Après, l'image produite est vérifiée à son tour : refusée, elle n'est ni enregistrée ni affichée.
// Les clés KIE_API_KEY et ANTHROPIC_API_KEY sont des secrets Supabase : elles ne quittent jamais le serveur.
// Lectures avec le JWT de l'utilisateur (RLS) ; écritures des colonnes serveur avec service_role (migration 000005).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { type Image, verifierImages, verifierResultat } from './moderation.ts';
import { corpsCreation, essaiAbandonne, KIE, lireCreation, lireTache } from './kie.ts';
import { MESSAGE_RESULTAT_REFUSE } from './regles.ts';
import { droitActif, type Quota, verifierQuota } from './quota.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
// Durée des liens signés donnés à Kie pour lire les deux images figées.
const DUREE_LIEN_KIE_S = 15 * 60;
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

// La clé Kie a d'abord été rangée sous OPENAI_API_KEY (12 oct. 2026) : on accepte les deux noms.
function cleKie() {
  return Deno.env.get('KIE_API_KEY') ?? Deno.env.get('OPENAI_API_KEY');
}

async function kie(chemin: string, init: RequestInit): Promise<unknown> {
  const cle = cleKie();
  if (!cle) throw new Error('cle_absente');
  const res = await fetch(`${KIE}${chemin}`, {
    ...init,
    signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
  });
  return await res.json().catch(() => null);
}

const TYPES_IMAGE = ['image/jpeg', 'image/png', 'image/webp'] as const;

// Copie l'image de l'utilisateur dans `figes` (bucket sans accès utilisateur) : il ne peut plus la remplacer
// entre la vérification et la lecture par Kie. La lecture se fait avec son JWT, donc seulement ses fichiers.
async function figer(supabase: SupabaseClient, admin: SupabaseClient, bucket: string, chemin: string, cible: string) {
  const { data, error } = await supabase.storage.from(bucket).download(chemin);
  if (error || !data) throw new Error(`Image introuvable : ${error?.message}`);
  const type = (data.type || 'image/jpeg').split(';')[0].trim() as Image['type'];
  if (!TYPES_IMAGE.includes(type)) throw new Error('Format d’image non pris en charge.');
  const octets = new Uint8Array(await data.arrayBuffer());
  const envoi = await admin.storage.from('figes').upload(cible, octets, { contentType: type, upsert: true });
  if (envoi.error) throw new Error(`Copie de l’image impossible : ${envoi.error.message}`);
  const lien = await admin.storage.from('figes').createSignedUrl(cible, DUREE_LIEN_KIE_S);
  if (lien.error || !lien.data) throw new Error(`Lien de l’image impossible : ${lien.error?.message}`);
  return { image: { octets, type } satisfies Image, url: lien.data.signedUrl };
}

// Un dossier par essai, un nom unique par tentative : une relance ne réécrit jamais une image déjà donnée à Kie.
function cheminsFiges(uid: string, essaiId: string) {
  const tentative = `${Date.now()}-${crypto.randomUUID()}`;
  return { vetement: `${uid}/${essaiId}/${tentative}-vetement`, personne: `${uid}/${essaiId}/${tentative}-personne` };
}

async function nettoyerFiges(admin: SupabaseClient, uid: string, essaiId: string) {
  const { data } = await admin.storage.from('figes').list(`${uid}/${essaiId}`);
  if (data?.length) await admin.storage.from('figes').remove(data.map((f) => `${uid}/${essaiId}/${f.name}`));
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
  // Sans clé Kie, inutile de payer la vérification.
  if (!cleKie()) throw new Error('cle_absente');

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
  // `lance_at` est posé ICI, avant la ligne du journal : suivre() retrouve cette ligne par created_at >= lance_at
  // (posé après, le 13 oct. 2026, le coût n'était jamais noté et un échec n'était jamais rendu).
  const { data: reserve } = await admin
    .from('essais')
    .update({
      statut: 'en_cours',
      tache_id: null,
      message: null,
      erreur_technique: null,
      lance_at: new Date().toISOString(),
    })
    .eq('id', essai.id)
    .eq('user_id', uid)
    .in('statut', ['a_faire', 'refuse', 'erreur'])
    .select('id');
  if (!reserve?.length) return reponse(200, { statut: 'en_cours' });

  const remettre = (statut: string, message: string | null, technique: string | null = null) =>
    admin.from('essais').update({ statut, message, erreur_technique: technique }).eq('id', essai.id);

  try {
    const chemins = cheminsFiges(uid, essai.id);
    const vetement = await figer(supabase, admin, essai.vetement_bucket, essai.vetement_path, chemins.vetement);
    const personne = await figer(supabase, admin, 'silhouettes', profil.photo_soi_path, chemins.personne);

    const decision = await verifierImages(vetement.image, personne.image);
    if (!decision.autorise) {
      await nettoyerFiges(admin, uid, essai.id);
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
      await nettoyerFiges(admin, uid, essai.id);
      await remettre('a_faire', null);
      return refusQuota(quotaApres);
    }

    let tacheId: string;
    try {
      tacheId = lireCreation(
        await kie('/createTask', { method: 'POST', body: JSON.stringify(corpsCreation(personne.url, vetement.url)) }),
      );
    } catch (e) {
      // Kie n'a rien pris en charge : l'essai ne compte pas dans le plafond.
      await admin.from('essayages_journal').delete().eq('id', ligne.id);
      throw e;
    }

    const maj = await admin.from('essais').update({ tache_id: tacheId }).eq('id', essai.id);
    if (maj.error) throw new Error(`Enregistrement de la tâche impossible : ${maj.error.message}`);
    return reponse(200, { statut: 'en_cours' });
  } catch (e) {
    // Les copies figées contiennent la photo de la personne : on ne les laisse pas traîner après un échec.
    await nettoyerFiges(admin, uid, essai.id).catch(() => {});
    const detail = e instanceof Error ? e.message : String(e);
    await remettre('erreur', 'L’essayage n’a pas pu démarrer.', detail.slice(0, 500));
    throw e;
  }
}

async function suivre(supabase: SupabaseClient, admin: SupabaseClient, uid: string, essaiId: string) {
  const { data: essai, error } = await supabase
    .from('essais')
    .select('id, statut, tache_id, lance_at, resultat_path, message')
    .eq('id', essaiId)
    .single();
  if (error || !essai) return reponse(404, { erreur: 'Essai introuvable.' });
  if (essai.statut !== 'en_cours' || !essai.tache_id) {
    return reponse(200, { statut: essai.statut, resultat_path: essai.resultat_path, message: essai.message });
  }

  // Ne passe à l'état final qu'un essai encore « en cours » : deux suivis simultanés ne s'écrasent pas.
  const finir = (statut: string, champs: Record<string, unknown>) =>
    admin.from('essais').update({ statut, ...champs }).eq('id', essai.id).eq('statut', 'en_cours');
  // Le journal garde les crédits Kie consommés, pour vérifier le budget (environ 1 € par abonné et par mois).
  const noterCredits = (credits: number | null) =>
    admin
      .from('essayages_journal')
      .update({ usage: { fournisseur: 'kie', credits } })
      .eq('essai_id', essai.id)
      .gte('created_at', essai.lance_at);
  const rendreEssayage = () =>
    admin.from('essayages_journal').delete().eq('essai_id', essai.id).gte('created_at', essai.lance_at);

  const tache = lireTache(await kie(`/recordInfo?taskId=${encodeURIComponent(essai.tache_id)}`, { method: 'GET' }));

  if (tache.etat === 'en_cours') {
    if (!essaiAbandonne(essai.lance_at, new Date())) return reponse(200, { statut: 'en_cours' });
    // File d'attente bloquée : on libère l'essai et on rend l'essayage.
    const message = 'L’essayage a pris trop de temps. Réessaie.';
    await rendreEssayage();
    await nettoyerFiges(admin, uid, essai.id);
    await finir('erreur', { message, erreur_technique: 'délai dépassé chez Kie' });
    return reponse(200, { statut: 'erreur', message });
  }

  if (tache.etat === 'echec') {
    // Kie ne facture pas une tâche échouée (creditsConsumed = 0) : l'essai ne compte pas.
    if (!tache.credits) await rendreEssayage();
    else await noterCredits(tache.credits);
    const message = 'L’IA n’a pas pu créer l’image. Réessaie dans un instant.';
    await nettoyerFiges(admin, uid, essai.id);
    await finir('erreur', { message, erreur_technique: tache.raison.slice(0, 500) });
    return reponse(200, { statut: 'erreur', message });
  }

  await noterCredits(tache.credits);
  // Kie efface ses images au bout de 14 jours : on copie le résultat chez nous, après vérification.
  const image = await fetch(tache.url, { signal: AbortSignal.timeout(20000) });
  const type = (image.headers.get('content-type') ?? 'image/png').split(';')[0].trim() as Image['type'];
  const octets = new Uint8Array(await image.arrayBuffer());
  // Format inattendu ou image refusée : rien n'est enregistré ni montré. L'essayage reste décompté
  // (Kie l'a facturé) : sinon, provoquer des refus ferait générer des images à nos frais.
  if (!TYPES_IMAGE.includes(type) || !(await verifierResultat({ octets, type }))) {
    await nettoyerFiges(admin, uid, essai.id);
    await finir('refuse', { message: MESSAGE_RESULTAT_REFUSE });
    return reponse(200, { statut: 'refuse', message: MESSAGE_RESULTAT_REFUSE });
  }
  const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const chemin = `${uid}/${essai.id}.${extension}`;
  const envoi = await admin.storage.from('essayages').upload(chemin, octets, { contentType: type, upsert: true });
  if (envoi.error) throw new Error(`Copie du résultat impossible : ${envoi.error.message}`);

  await nettoyerFiges(admin, uid, essai.id);
  await finir('fait', { resultat_path: chemin, message: null, erreur_technique: null });
  return reponse(200, { statut: 'fait', resultat_path: chemin });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reponse(405, { erreur: 'Méthode non autorisée.' });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: utilisateur } = await supabase.auth.getUser();
  if (!utilisateur.user) return reponse(401, { erreur: 'Session invalide.' });
  // Client serveur : seul à pouvoir écrire statut, résultat, journal et images figées.
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
    if (action === 'suivre') return await suivre(supabase, admin, utilisateur.user.id, essaiId);
    return reponse(400, { erreur: 'Action inconnue.' });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'cle_absente') {
      return reponse(503, { erreur: 'L’essayage n’est pas encore activé (clé du service d’image manquante).' });
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
    if (message.startsWith('kie:')) {
      return reponse(502, { erreur: 'Le service d’image n’a pas accepté la demande. Réessaie dans un instant.' });
    }
    return reponse(500, { erreur: message });
  }
});
