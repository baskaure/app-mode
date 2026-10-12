// Edge Function TEMPORAIRE : banc d'essai de l'API Kling « Virtual Try-on » (qualité réelle, 12 oct. 2026).
// Rejoue le test du 12 oct. (démo gratuite Kolors) sur l'API payante, avec les mêmes images, rangées par le compte
// de test dans vetements/<uid>/banc/. Réservée à ce seul compte de test ; aucun quota de l'app n'est touché.
//   POST { action: 'lancer', personne, vetement } → { task_id }   (noms de fichiers dans vetements/<uid>/banc/)
//   POST { action: 'suivre', task_id }            → { statut, url? }
// À neutraliser après le banc (redéployer une version qui répond 410).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { imageDeSortie, lireTache } from '../essayage/kling-suivi.ts';

const COMPTE_DE_TEST = '519731e8-4162-43a9-94fc-3ce4a9459e32';
const KLING = 'https://api-singapore.klingai.com';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function reponse(statut: number, corps: Record<string, unknown>) {
  return new Response(JSON.stringify(corps), { status: statut, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

async function kling(chemin: string, init: RequestInit) {
  const res = await fetch(`${KLING}${chemin}`, {
    ...init,
    signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Bearer ${Deno.env.get('KLING_API_KEY')}`, 'Content-Type': 'application/json' },
  });
  const corps = await res.json().catch(() => ({}));
  if (!res.ok || corps.code !== 0) throw new Error(`kling:${corps.message ?? res.status}`);
  return corps as { data?: unknown };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: utilisateur } = await supabase.auth.getUser();
  if (utilisateur.user?.id !== COMPTE_DE_TEST) return reponse(403, { erreur: 'Réservé au compte de test.' });

  const corps = await req.json().catch(() => ({}));
  const nomValide = (n: unknown) => typeof n === 'string' && /^[\w.-]+\.jpg$/.test(n);
  try {
    if (corps.action === 'lancer' && nomValide(corps.personne) && nomValide(corps.vetement)) {
      const lien = async (nom: string) => {
        const { data, error } = await supabase.storage
          .from('vetements')
          .createSignedUrl(`${COMPTE_DE_TEST}/banc/${nom}`, 15 * 60);
        if (error || !data) throw new Error(`image ${nom} : ${error?.message}`);
        return data.signedUrl;
      };
      const tache = await kling('/solutions/virtual_try_on', {
        method: 'POST',
        body: JSON.stringify({
          contents: [
            { type: 'product_image', url: await lien(corps.vetement) },
            { type: 'person_image', url: await lien(corps.personne) },
          ],
          // Réglage testable : keep_pose=false laisse peut-être la coupe suivre le vêtement (test du 13 oct.).
          settings: { keep_face: true, keep_pose: corps.keep_pose !== false, keep_background: true },
          options: { external_task_id: `banc-${corps.personne}-${corps.vetement}-${corps.keep_pose === false ? 'libre' : 'pose'}-${Date.now()}`, watermark: { enabled: false } },
        }),
      });
      return reponse(200, { task_id: (tache.data as { task_id?: string } | undefined)?.task_id ?? null });
    }
    if (corps.action === 'suivre' && typeof corps.task_id === 'string') {
      const suivi = await kling(`/solutions?task_ids=${encodeURIComponent(corps.task_id)}`, { method: 'GET' });
      const tache = lireTache(suivi.data, corps.task_id);
      return reponse(200, {
        statut: tache?.status ?? 'inconnu',
        message: tache?.message ?? null,
        url: tache ? imageDeSortie(tache) : null,
      });
    }
    return reponse(400, { erreur: 'Requête invalide.' });
  } catch (e) {
    return reponse(502, { erreur: e instanceof Error ? e.message : String(e) });
  }
});
