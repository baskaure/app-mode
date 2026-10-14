// Edge Function : regarde la photo d'une pièce du dressing et en déduit catégorie, couleur et une courte
// description (« ton jean droit bleu »), pour proposer des articles du catalogue qui vont avec.
// Claude Haiku 5.5, sortie JSON imposée ; la décision finale passe par normaliser() (regles.ts).
// Tout passe avec le JWT de l'utilisateur : RLS limite la lecture et l'écriture à ses propres pièces.
// Secret : ANTHROPIC_API_KEY (déjà utilisé par la fonction essayage).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.133.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { CONSIGNE, normaliser, plafondAtteint, SCHEMA, type Analyse } from './regles.ts';

const MODELE = 'claude-haiku-5-5';
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function reponse(statut: number, corps: Record<string, unknown>) {
  return new Response(JSON.stringify(corps), { status: statut, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

function enBase64(octets: Uint8Array): string {
  let binaire = '';
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(binaire);
}

async function analyser(octets: Uint8Array, type: 'image/jpeg' | 'image/png' | 'image/webp'): Promise<Analyse | null> {
  const cle = Deno.env.get('ANTHROPIC_API_KEY');
  if (!cle) throw new Error('cle_absente');
  const client = new Anthropic({ apiKey: cle, timeout: 30_000, maxRetries: 2 });
  const message = await client.messages.create({
    model: MODELE,
    max_tokens: 200,
    thinking: { type: 'disabled' },
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: type, data: enBase64(octets) } },
          { type: 'text', text: CONSIGNE },
        ],
      },
    ],
  });
  if (message.stop_reason === 'refusal') return null;
  const texte = message.content.find((b) => b.type === 'text');
  if (!texte || texte.type !== 'text') return null;
  try {
    return JSON.parse(texte.text) as Analyse;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reponse(405, { erreur: 'Méthode non autorisée.' });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: utilisateur } = await supabase.auth.getUser();
  if (!utilisateur.user) return reponse(401, { erreur: 'Session invalide.' });

  let pieceId: string;
  try {
    pieceId = String((await req.json()).piece_id ?? '');
  } catch {
    return reponse(400, { erreur: 'Requête invalide.' });
  }
  if (!/^[0-9a-f-]{36}$/i.test(pieceId)) return reponse(400, { erreur: 'Pièce inconnue.' });

  // Plafond : analyses faites par cette personne sur les dernières 24 h (RLS : seulement ses pièces).
  const depuis = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentes = await supabase.from('pieces').select('id', { count: 'exact', head: true }).gte('analyse_at', depuis);
  if (recentes.error || plafondAtteint(recentes.count ?? 0)) {
    return reponse(429, { erreur: 'Beaucoup de pièces analysées aujourd’hui : la suite sera reconnue demain.' });
  }

  const piece = await supabase.from('pieces').select('id, photo_path').eq('id', pieceId).maybeSingle();
  if (piece.error || !piece.data) return reponse(404, { erreur: 'Pièce introuvable.' });

  const fichier = await supabase.storage.from('pieces').download(piece.data.photo_path);
  if (fichier.error || !fichier.data) return reponse(404, { erreur: 'Photo de la pièce introuvable.' });
  const type = fichier.data.type.split(';')[0].trim();
  if (!TYPES.has(type)) return reponse(422, { erreur: 'Format de photo non pris en charge.' });

  let maj;
  try {
    const octets = new Uint8Array(await fichier.data.arrayBuffer());
    maj = normaliser(await analyser(octets, type as 'image/jpeg' | 'image/png' | 'image/webp'));
  } catch (e) {
    const message = e instanceof Error && e.message === 'cle_absente' ? 'Analyse indisponible (clé manquante).' : 'Analyse indisponible pour le moment.';
    return reponse(503, { erreur: message });
  }

  const ecrit = await supabase
    .from('pieces')
    .update({ ...maj, analyse_at: new Date().toISOString() })
    .eq('id', pieceId)
    .select('id, categorie, couleur, description')
    .single();
  if (ecrit.error) return reponse(500, { erreur: `Enregistrement impossible : ${ecrit.error.message}` });
  return reponse(200, { piece: ecrit.data });
});
