// Partie pure de l'appel à OpenAI (sans réseau ni Deno) : consigne, lecture de la réponse, coût estimé.
// Doc lue le 12 oct. 2026 : https://developers.openai.com/api/docs/guides/image-generation
// (POST /v1/images/edits, plusieurs images dans `image[]`, résultat en base64 dans data[0].b64_json).

// `gpt-image-2.5-sunburst` : la variante « précision d'édition » (l'autre, flare, vise la vitesse).
export const MODELE_IMAGE = 'gpt-image-2.5-sunburst';
// Format portrait : la photo de soi est en pied. Côtés multiples de 16, comme l'exige l'API.
export const TAILLE_IMAGE = '1024x1536';

// Ordre des images envoyées : 1 = la personne, 2 = le vêtement. La consigne s'y réfère.
export const CONSIGNE_ESSAYAGE = `Virtual try-on.
Image 1 is a photo of a real person. Image 2 shows one garment.
Edit image 1 so that the person wears the garment from image 2.

Keep exactly the same as image 1: face, hair, skin, body shape and proportions, height, pose, hands, background, lighting and framing. Never slim, enlarge or reshape the body.

Reproduce the garment faithfully: same cut and fit (straight stays straight, wide stays wide, fitted stays fitted), same length, colour, fabric, pattern and details.

Replace only what the garment replaces: a top replaces the top, trousers or a skirt replace the bottoms, a dress replaces both. Keep every other piece of clothing, the shoes and the accessories unchanged. Never remove clothing and never show more skin than image 1, except where the garment itself is designed to.

Photorealistic result. No text, no logo added, no watermark.`;

export type Usage = {
  input_tokens?: number;
  output_tokens?: number;
  input_tokens_details?: { text_tokens?: number; image_tokens?: number };
};

// Tarifs par million de jetons (sources secondaires du 12 oct. 2026, à confirmer sur la facture) :
// texte en entrée 5 $, image en entrée 8 $, image en sortie 30 $.
const TARIF = { texte: 5, imageEntree: 8, imageSortie: 30 } as const;

export function estimerCoutUsd(usage: Usage | undefined): number | null {
  if (!usage || typeof usage.output_tokens !== 'number') return null;
  const images = usage.input_tokens_details?.image_tokens ?? 0;
  const textes = usage.input_tokens_details?.text_tokens ?? Math.max(0, (usage.input_tokens ?? 0) - images);
  const cout = (textes * TARIF.texte + images * TARIF.imageEntree + usage.output_tokens * TARIF.imageSortie) / 1e6;
  return Math.round(cout * 1e5) / 1e5;
}

export type ResultatImage = { base64: string; usage?: Usage };

// Lit la réponse de /v1/images/edits. Lève 'openai:…' si elle ne contient pas d'image.
export function lireReponse(corps: unknown): ResultatImage {
  const c = corps as { data?: { b64_json?: unknown }[]; usage?: Usage; error?: { message?: string } } | null;
  const base64 = c?.data?.[0]?.b64_json;
  if (typeof base64 !== 'string' || base64.length === 0) {
    throw new Error(`openai:${c?.error?.message ?? 'réponse sans image'}`);
  }
  return { base64, usage: c?.usage };
}

export function depuisBase64(base64: string): Uint8Array {
  const binaire = atob(base64);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
  return octets;
}

// Un essai « en cours » depuis plus longtemps que ça a été abandonné (worker arrêté, plafond de durée atteint).
export const DUREE_MAX_ESSAI_MS = 4 * 60 * 1000;

export function essaiAbandonne(lanceAt: string | null, maintenant: Date): boolean {
  if (!lanceAt) return false;
  return maintenant.getTime() - new Date(lanceAt).getTime() > DUREE_MAX_ESSAI_MS;
}
