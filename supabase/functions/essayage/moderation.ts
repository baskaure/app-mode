// Filtre avant l'essayage : pas de lingerie, de maillot de bain, de vêtement transparent ni de nudité.
// Claude Haiku 5.5 regarde les deux images (vêtement + photo de soi) et répond en JSON strict.
// Règle : en cas de doute ou de panne, on bloque (le service d'image n'est jamais appelé sans feu vert).
import Anthropic from 'npm:@anthropic-ai/sdk@0.133.0';

import {
  CONSIGNE,
  CONSIGNE_RESULTAT,
  decider,
  deciderResultat,
  SCHEMA,
  SCHEMA_RESULTAT,
  type Decision,
  type Verdict,
  type VerdictResultat,
} from './regles.ts';

const MODELE = 'claude-haiku-5-5';

export type Image = { octets: Uint8Array; type: 'image/jpeg' | 'image/png' | 'image/webp' };

function enBase64(octets: Uint8Array): string {
  let binaire = '';
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(binaire);
}

// Les octets sont envoyés tels quels (pas d'URL) : Claude voit exactement ce que le service d'image recevra.
// Renvoie la décision. Lève 'moderation_cle_absente' si le secret manque, 'moderation:…' si l'API échoue.
export async function verifierImages(vetement: Image, personne: Image): Promise<Decision> {
  const cle = Deno.env.get('ANTHROPIC_API_KEY');
  if (!cle) throw new Error('moderation_cle_absente');
  const client = new Anthropic({ apiKey: cle, timeout: 30_000, maxRetries: 2 });

  let reponse: Anthropic.Message;
  try {
    reponse = await client.messages.create({
      model: MODELE,
      max_tokens: 200,
      // Tâche de classement simple : pas de réflexion, effort bas, sortie JSON imposée.
      thinking: { type: 'disabled' },
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Image 1 (vêtement) :' },
            { type: 'image', source: { type: 'base64', media_type: vetement.type, data: enBase64(vetement.octets) } },
            { type: 'text', text: 'Image 2 (personne) :' },
            { type: 'image', source: { type: 'base64', media_type: personne.type, data: enBase64(personne.octets) } },
            { type: 'text', text: CONSIGNE },
          ],
        },
      ],
    });
  } catch (e) {
    if (e instanceof Anthropic.APIError) throw new Error(`moderation:${e.status ?? 'réseau'}`);
    throw new Error('moderation:réseau');
  }

  // Le modèle a refusé de regarder : l'image pose problème, on bloque.
  if (reponse.stop_reason === 'refusal') return decider(null);
  const texte = reponse.content.find((b) => b.type === 'text');
  if (!texte || texte.type !== 'text') return decider(null);
  try {
    return decider(JSON.parse(texte.text) as Verdict);
  } catch {
    return decider(null);
  }
}

// Vérifie l'image produite par le fournisseur d'essayage. true = affichable. Mêmes erreurs que verifierImages.
export async function verifierResultat(resultat: Image): Promise<boolean> {
  const cle = Deno.env.get('ANTHROPIC_API_KEY');
  if (!cle) throw new Error('moderation_cle_absente');
  const client = new Anthropic({ apiKey: cle, timeout: 30_000, maxRetries: 2 });

  let reponse: Anthropic.Message;
  try {
    reponse = await client.messages.create({
      model: MODELE,
      max_tokens: 200,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA_RESULTAT } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: resultat.type, data: enBase64(resultat.octets) } },
            { type: 'text', text: CONSIGNE_RESULTAT },
          ],
        },
      ],
    });
  } catch (e) {
    if (e instanceof Anthropic.APIError) throw new Error(`moderation:${e.status ?? 'réseau'}`);
    throw new Error('moderation:réseau');
  }

  if (reponse.stop_reason === 'refusal') return false;
  const texte = reponse.content.find((b) => b.type === 'text');
  if (!texte || texte.type !== 'text') return false;
  try {
    return deciderResultat(JSON.parse(texte.text) as VerdictResultat);
  } catch {
    return false;
  }
}
