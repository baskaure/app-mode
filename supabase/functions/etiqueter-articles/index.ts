// Edge Function : étiquette les articles du catalogue pas encore vus par l'IA (16 oct. 2026).
// Pour chaque article : nom court et propre, catégorie corrigée, couleur, coupe ; les articles hors sujet sont
// désactivés. Claude Haiku 5.5, sortie JSON imposée, 30 articles par appel, titres seulement (pas d'image).
// Appelée par scripts/importer-web.mjs après l'import, avec la clé service_role (jamais par l'app).
// Secret : ANTHROPIC_API_KEY (déjà utilisé par essayage et analyser-piece).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.133.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { CONSIGNE, controler, lignes, SCHEMA, type Entree, type Etiquette } from './regles.ts';

const MODELE = 'claude-haiku-5-5';
const PAR_APPEL = 30;
const PAR_PASSAGE = 90;

function reponse(statut: number, corps: Record<string, unknown>) {
  return new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json' } });
}

async function etiqueter(client: Anthropic, entrees: Entree[]): Promise<Etiquette[]> {
  const message = await client.messages.create({
    model: MODELE,
    max_tokens: 4000,
    thinking: { type: 'disabled' },
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{ role: 'user', content: `${CONSIGNE}\n\nArticles (un par ligne, en JSON) :\n${lignes(entrees)}` }],
  });
  const texte = message.content.find((b) => b.type === 'text');
  if (!texte || texte.type !== 'text') return [];
  try {
    return controler(JSON.parse(texte.text), entrees);
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reponse(405, { erreur: 'Méthode non autorisée.' });
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!service || req.headers.get('Authorization') !== `Bearer ${service}`) return reponse(401, { erreur: 'Réservé à l’import.' });
  const cle = Deno.env.get('ANTHROPIC_API_KEY');
  if (!cle) return reponse(503, { erreur: 'Clé Anthropic absente.' });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, service, { auth: { persistSession: false } });
  const { data, error } = await admin
    .from('articles')
    .select('id, nom, marchand, categorie, vestiaire')
    .is('etiquete_at', null)
    .eq('actif', true)
    .order('maj_at', { ascending: false })
    .limit(PAR_PASSAGE);
  if (error) return reponse(500, { erreur: error.message });
  const aFaire = (data ?? []) as Entree[];

  const client = new Anthropic({ apiKey: cle, timeout: 60_000, maxRetries: 2 });
  let gardes = 0;
  let ecartes = 0;
  let echecs = 0;
  let erreur: string | null = null;
  const maintenant = new Date().toISOString();
  for (let i = 0; i < aFaire.length; i += PAR_APPEL) {
    const lot = aFaire.slice(i, i + PAR_APPEL);
    let etiquettes: Etiquette[] = [];
    try {
      etiquettes = await etiqueter(client, lot);
    } catch (e) {
      echecs += lot.length;
      erreur ??= e instanceof Error ? e.message.slice(0, 300) : String(e);
      continue;
    }
    for (const e of etiquettes) {
      const maj = e.garder
        ? { nom_court: e.nom_court, categorie: e.categorie, couleur: e.couleur, coupe: e.coupe, etiquete_at: maintenant }
        : { actif: false, etiquete_at: maintenant };
      const { error: ecrit } = await admin.from('articles').update(maj).eq('id', e.id);
      if (ecrit) echecs++;
      else if (e.garder) gardes++;
      else ecartes++;
    }
    // Articles sans réponse valide : repris au passage suivant.
    echecs += lot.length - etiquettes.length;
  }

  const { count } = await admin
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .is('etiquete_at', null)
    .eq('actif', true);
  return reponse(200, { gardes, ecartes, echecs, restants: count ?? null, erreur });
});
