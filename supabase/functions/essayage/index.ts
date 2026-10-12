// Edge Function : essayage d'un vêtement sur la photo de soi, par l'API Kling « Virtual Try-on ».
// Doc : https://kling.ai/document-api/api/ecommerce-replication/virtual-try-on (lue le 12 oct. 2026).
//   POST { action: 'lancer', essai_id } → crée la tâche Kling, l'essai passe « en_cours ».
//   POST { action: 'suivre', essai_id } → interroge Kling ; si c'est fini, copie l'image dans le bucket `essayages`.
// La clé KLING_API_KEY est un secret Supabase : elle ne quitte jamais le serveur.
// Tout passe avec le JWT de l'utilisateur : les règles RLS limitent l'accès à ses propres données.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const KLING = 'https://api-singapore.klingai.com';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
// Durée des liens signés donnés à Kling pour lire les deux images.
const DUREE_LIEN_KLING_S = 15 * 60;
// Plafond d'essayages par utilisateur et par mois (le coût Kling est d'environ 0,112 $ par image).
const MAX_PAR_MOIS = Number(Deno.env.get('ESSAIS_MAX_PAR_MOIS') ?? '30');

function reponse(statut: number, corps: Record<string, unknown>) {
  return new Response(JSON.stringify(corps), { status: statut, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

async function kling(chemin: string, init: RequestInit): Promise<Record<string, unknown>> {
  const cle = Deno.env.get('KLING_API_KEY');
  if (!cle) throw new Error('cle_absente');
  const res = await fetch(`${KLING}${chemin}`, {
    ...init,
    signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
  });
  const corps = await res.json().catch(() => ({}));
  if (!res.ok || corps.code !== 0) {
    throw new Error(`kling:${corps.message ?? res.status}`);
  }
  return corps;
}

async function lienSigne(supabase: SupabaseClient, bucket: string, chemin: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(chemin, DUREE_LIEN_KLING_S);
  if (error || !data) throw new Error(`Lien de l’image impossible : ${error?.message}`);
  return data.signedUrl;
}

async function lancer(supabase: SupabaseClient, uid: string, essaiId: string) {
  const { data: essai, error } = await supabase
    .from('essais')
    .select('id, statut, vetement_bucket, vetement_path')
    .eq('id', essaiId)
    .single();
  if (error || !essai) return reponse(404, { erreur: 'Essai introuvable.' });
  if (essai.statut === 'en_cours' || essai.statut === 'fait') return reponse(200, { statut: essai.statut });

  const { data: profil } = await supabase.from('profils').select('photo_soi_path').eq('id', uid).single();
  if (!profil?.photo_soi_path) return reponse(400, { erreur: 'Ajoute d’abord une photo de toi.' });

  const debutMois = new Date();
  debutMois.setUTCDate(1);
  debutMois.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('essais')
    .select('id', { count: 'exact', head: true })
    .not('lance_at', 'is', null)
    .gte('lance_at', debutMois.toISOString());
  if ((count ?? 0) >= MAX_PAR_MOIS) {
    return reponse(429, { erreur: `Tu as atteint ${MAX_PAR_MOIS} essayages ce mois-ci.` });
  }

  const tache = await kling('/solutions/virtual_try_on', {
    method: 'POST',
    body: JSON.stringify({
      contents: [
        { type: 'product_image', url: await lienSigne(supabase, essai.vetement_bucket, essai.vetement_path) },
        { type: 'person_image', url: await lienSigne(supabase, 'silhouettes', profil.photo_soi_path) },
      ],
      // Fidélité maximale : même visage, même pose, même fond.
      settings: { keep_face: true, keep_pose: true, keep_background: true },
      // L'identifiant doit être unique sur le compte Kling, y compris quand on relance après une erreur.
      options: { external_task_id: `${essai.id}-${Date.now()}`, watermark: { enabled: false } },
    }),
  });
  const taskId = (tache.data as { task_id?: string } | undefined)?.task_id;
  if (!taskId) throw new Error('kling:réponse sans identifiant de tâche');

  await supabase
    .from('essais')
    .update({ statut: 'en_cours', kling_task_id: taskId, lance_at: new Date().toISOString(), message: null })
    .eq('id', essai.id);
  return reponse(200, { statut: 'en_cours' });
}

async function suivre(supabase: SupabaseClient, uid: string, essaiId: string) {
  const { data: essai, error } = await supabase
    .from('essais')
    .select('id, statut, kling_task_id, resultat_path, message')
    .eq('id', essaiId)
    .single();
  if (error || !essai) return reponse(404, { erreur: 'Essai introuvable.' });
  if (essai.statut !== 'en_cours' || !essai.kling_task_id) {
    return reponse(200, { statut: essai.statut, resultat_path: essai.resultat_path, message: essai.message });
  }

  const suivi = await kling(`/solutions?task_ids=${encodeURIComponent(essai.kling_task_id)}`, { method: 'GET' });
  const tache = (suivi.data as Array<{ status: string; message?: string; outputs?: Array<{ type: string; url: string }> }>)[0];
  if (!tache || tache.status === 'submitted' || tache.status === 'processing') {
    return reponse(200, { statut: 'en_cours' });
  }

  if (tache.status === 'failed') {
    const message = tache.message ?? 'L’essayage a échoué.';
    await supabase.from('essais').update({ statut: 'erreur', message }).eq('id', essai.id);
    return reponse(200, { statut: 'erreur', message });
  }

  const sortie = tache.outputs?.find((o) => o.type === 'image');
  if (!sortie) {
    await supabase.from('essais').update({ statut: 'erreur', message: 'Pas d’image en sortie.' }).eq('id', essai.id);
    return reponse(200, { statut: 'erreur', message: 'Pas d’image en sortie.' });
  }

  // Kling efface ses images au bout de 30 jours : on copie le résultat chez nous.
  const image = await fetch(sortie.url, { signal: AbortSignal.timeout(20000) });
  const type = (image.headers.get('content-type') ?? 'image/jpeg').split(';')[0].trim();
  const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const chemin = `${uid}/${essai.id}.${extension}`;
  const envoi = await supabase.storage
    .from('essayages')
    .upload(chemin, new Uint8Array(await image.arrayBuffer()), { contentType: type, upsert: true });
  if (envoi.error) throw new Error(`Copie du résultat impossible : ${envoi.error.message}`);

  await supabase.from('essais').update({ statut: 'fait', resultat_path: chemin }).eq('id', essai.id);
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

  let action: string;
  let essaiId: string;
  try {
    ({ action, essai_id: essaiId } = await req.json());
  } catch {
    return reponse(400, { erreur: 'Requête invalide.' });
  }
  if (typeof essaiId !== 'string') return reponse(400, { erreur: 'Essai manquant.' });

  try {
    if (action === 'lancer') return await lancer(supabase, utilisateur.user.id, essaiId);
    if (action === 'suivre') return await suivre(supabase, utilisateur.user.id, essaiId);
    return reponse(400, { erreur: 'Action inconnue.' });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'cle_absente') {
      return reponse(503, { erreur: 'L’essayage n’est pas encore activé (clé Kling manquante).' });
    }
    if (message.startsWith('kling:')) {
      return reponse(502, { erreur: `Le service d’essayage a refusé la demande : ${message.slice(6)}` });
    }
    return reponse(500, { erreur: message });
  }
});
