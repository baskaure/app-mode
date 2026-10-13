// Partie pure de l'appel à Kie.ai (sans réseau ni Deno) : consigne, création de tâche, lecture du suivi.
// Kie.ai revend l'accès au modèle d'image d'OpenAI. Doc lue le 13 oct. 2026 :
//   https://docs.kie.ai/market/gpt/gpt-image-2-5-sunburst-image-to-image.md (POST /api/v1/jobs/createTask)
//   https://docs.kie.ai/market/common/get-task-detail.md (GET /api/v1/jobs/recordInfo?taskId=…)
// L'API répond HTTP 200 même en cas d'échec : seul le champ `code` fait foi (200 = succès).

export const KIE = 'https://api.kie.ai/api/v1/jobs';
// La variante « précision d'édition » de GPT Image 2.5, choisie par l'utilisateur le 12 oct. 2026.
export const MODELE_IMAGE = 'gpt-image-2-5-sunburst-image-to-image';

// Ordre des images envoyées : 1 = la personne, 2 = le vêtement. La consigne s'y réfère.
export const CONSIGNE_ESSAYAGE = `Virtual try-on.
Image 1 is a photo of a real person. Image 2 shows one garment.
Edit image 1 so that the person wears the garment from image 2.

Keep exactly the same as image 1: face, hair, skin, body shape and proportions, height, pose, hands, background, lighting and framing. Never slim, enlarge or reshape the body.

Reproduce the garment faithfully: same cut and fit (straight stays straight, wide stays wide, fitted stays fitted), same length, colour, fabric, pattern and details.

Replace only what the garment replaces: a top replaces the top, trousers or a skirt replace the bottoms, a dress replaces both. Keep every other piece of clothing, the shoes and the accessories unchanged. Never remove clothing and never show more skin than image 1, except where the garment itself is designed to.

Photorealistic result. No text, no logo added, no watermark.`;

// Corps de la création de tâche. `auto` garde le format de la photo de la personne ; 1K suffit pour un téléphone.
export function corpsCreation(urlPersonne: string, urlVetement: string) {
  return {
    model: MODELE_IMAGE,
    input: {
      prompt: CONSIGNE_ESSAYAGE,
      input_urls: [urlPersonne, urlVetement],
      aspect_ratio: 'auto',
      resolution: '1K',
    },
  };
}

type Reponse = { code?: unknown; msg?: unknown; data?: Record<string, unknown> | null } | null;

// Lève 'kie:…' si la réponse n'est pas un succès.
function verifier(corps: unknown): Record<string, unknown> {
  const c = corps as Reponse;
  if (!c || c.code !== 200 || !c.data) throw new Error(`kie:${typeof c?.msg === 'string' ? c.msg : 'réponse invalide'}`);
  return c.data;
}

export function lireCreation(corps: unknown): string {
  const taskId = verifier(corps).taskId;
  if (typeof taskId !== 'string' || !taskId) throw new Error('kie:réponse sans identifiant de tâche');
  return taskId;
}

export type Tache =
  | { etat: 'en_cours' }
  | { etat: 'fait'; url: string; credits: number | null }
  | { etat: 'echec'; raison: string; credits: number | null };

export function lireTache(corps: unknown): Tache {
  const d = verifier(corps);
  const credits = typeof d.creditsConsumed === 'number' ? d.creditsConsumed : null;
  if (d.state === 'fail') {
    const raison = [d.failCode, d.failMsg].filter((x) => typeof x === 'string' && x).join(' : ');
    return { etat: 'echec', raison: raison || 'échec sans raison', credits };
  }
  if (d.state !== 'success') return { etat: 'en_cours' };
  let url: unknown;
  try {
    url = (JSON.parse(String(d.resultJson)) as { resultUrls?: unknown[] }).resultUrls?.[0];
  } catch {
    url = undefined;
  }
  if (typeof url !== 'string' || !url) return { etat: 'echec', raison: 'succès sans image', credits };
  return { etat: 'fait', url, credits };
}

// Un essai « en cours » depuis plus longtemps que ça est abandonné (file d'attente bloquée, tâche perdue).
export const DUREE_MAX_ESSAI_MS = 6 * 60 * 1000;

export function essaiAbandonne(lanceAt: string | null, maintenant: Date): boolean {
  if (!lanceAt) return false;
  return maintenant.getTime() - new Date(lanceAt).getTime() > DUREE_MAX_ESSAI_MS;
}
