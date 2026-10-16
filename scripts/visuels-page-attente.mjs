// Visuels de la page d'attente : un mannequin créé par IA, un vêtement, puis le vrai essayage
// (même modèle et même consigne que l'app). Clé lue dans .env.kie.local (ignoré par git) : KIE_API_KEY=...
// Lancer depuis la racine : node scripts/visuels-page-attente.mjs   → images dans site/visuels/
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const cle = readFileSync('.env.kie.local', 'utf8').match(/^KIE_API_KEY=(.+)$/m)?.[1]?.trim();
if (!cle) throw new Error('KIE_API_KEY absente de .env.kie.local');

const KIE = 'https://api.kie.ai/api/v1/jobs';
const ENTETES = { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' };
// Même consigne que supabase/functions/essayage/kie.ts (CONSIGNE_ESSAYAGE).
const { CONSIGNE_ESSAYAGE } = await import('../supabase/functions/essayage/kie.ts').catch(() => ({}));

const MANNEQUIN = `Full-body photo of a young French woman in her mid-twenties with a natural pear body shape (hips wider than shoulders), standing facing the camera, relaxed natural pose, arms by her sides. She wears a plain white fitted t-shirt, light grey straight-leg trousers and white sneakers. Bright minimalist apartment, warm cream wall, soft daylight. Looks like a real photo taken with an iPhone by a friend: natural skin texture, no retouching, no beauty filter. Whole body visible from head to feet. No text, no logo.`;
const VETEMENT = `E-commerce product photo of a pair of high-waisted wide-leg jeans in a mid-blue wash, laid flat on a plain off-white background, top-down view, the whole garment visible, soft even light. No model, no text, no logo, no watermark.`;

async function lancer(model, input) {
  const r = await fetch(`${KIE}/createTask`, { method: 'POST', headers: ENTETES, body: JSON.stringify({ model, input }) });
  const c = await r.json();
  if (c.code !== 200) throw new Error(`création : ${c.msg}`);
  return c.data.taskId;
}

async function attendre(taskId) {
  for (let i = 0; i < 90; i++) {
    await new Promise((s) => setTimeout(s, 5000));
    const c = await (await fetch(`${KIE}/recordInfo?taskId=${taskId}`, { headers: ENTETES })).json();
    if (c.code !== 200) throw new Error(`suivi : ${c.msg}`);
    if (c.data.state === 'fail') throw new Error(`échec : ${c.data.failCode} ${c.data.failMsg}`);
    if (c.data.state === 'success') {
      console.log(`  crédits : ${c.data.creditsConsumed}`);
      return JSON.parse(c.data.resultJson).resultUrls[0];
    }
  }
  throw new Error('trop long');
}

async function enregistrer(url, nom) {
  const octets = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(`site/visuels/${nom}`, octets);
  console.log(`  → site/visuels/${nom}`);
}

mkdirSync('site/visuels', { recursive: true });
const t2i = 'gpt-image-2-5-sunburst-text-to-image';

console.log('1/3 mannequin');
const urlMannequin = await attendre(await lancer(t2i, { prompt: MANNEQUIN, aspect_ratio: '2:3', resolution: '2K' }));
await enregistrer(urlMannequin, 'avant.png');

console.log('2/3 vêtement');
const urlVetement = await attendre(await lancer(t2i, { prompt: VETEMENT, aspect_ratio: '1:1', resolution: '1K' }));
await enregistrer(urlVetement, 'vetement.png');

console.log('3/3 essayage');
const consigne = CONSIGNE_ESSAYAGE ?? readFileSync('supabase/functions/essayage/kie.ts', 'utf8').match(/CONSIGNE_ESSAYAGE = `([\s\S]*?)`;/)[1];
const urlEssai = await attendre(await lancer('gpt-image-2-5-sunburst-image-to-image', {
  prompt: consigne, input_urls: [urlMannequin, urlVetement], aspect_ratio: 'auto', resolution: '2K',
}));
await enregistrer(urlEssai, 'apres.png');
