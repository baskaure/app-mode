// Importe le catalogue « Trouvé sur le web » (Google Shopping via SerpApi) dans la table articles (source 'web'),
// puis désactive les articles web qui ne sont plus remontés. Lancé toutes les 2 semaines par GitHub Actions
// (.github/workflows/catalogue-web.yml), ou à la main :
//
//   SERPAPI_KEY="…" SUPABASE_SERVICE_ROLE_KEY="…" node scripts/importer-web.mjs
//
// 54 recherches par import : l'offre gratuite de SerpApi (250 par mois, à confirmer) tient 2 imports par mois.
import { readFileSync } from 'node:fs';

import { PAR_RECHERCHE, requetesCatalogue, versArticle } from '../src/lib/catalogue-web.ts';

function env(nom) {
  if (process.env[nom]) return process.env[nom];
  try {
    const ligne = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
      .split('\n')
      .find((l) => l.startsWith(`${nom}=`));
    if (ligne) return ligne.slice(nom.length + 1).trim();
  } catch {
    // pas de .env.local
  }
  throw new Error(`Variable manquante : ${nom}`);
}

const cleSerp = env('SERPAPI_KEY');
const base = env('EXPO_PUBLIC_SUPABASE_URL');
const cle = env('SUPABASE_SERVICE_ROLE_KEY');
const entetes = { apikey: cle, Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' };

const debut = new Date().toISOString();
const parId = new Map();
let erreurs = 0;

for (const q of requetesCatalogue()) {
  const url = new URL('https://serpapi.com/search.json');
  url.search = new URLSearchParams({ engine: 'google_shopping', q: q.requete, gl: 'fr', hl: 'fr', google_domain: 'google.fr', api_key: cleSerp }).toString();
  const reponse = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!reponse.ok) {
    erreurs++;
    console.error(`${q.requete} : HTTP ${reponse.status}`);
    continue;
  }
  const corps = await reponse.json();
  const lignes = (corps.shopping_results ?? []).map((r) => versArticle(r, q)).filter(Boolean).slice(0, PAR_RECHERCHE);
  for (const l of lignes) {
    const deja = parId.get(l.id_source);
    // Un même article remonté par deux styles garde les deux.
    if (deja) deja.styles = [...new Set([...deja.styles, ...l.styles])];
    else parId.set(l.id_source, { ...l, maj_at: debut });
  }
  console.log(`${q.requete} : ${lignes.length}`);
}

const lignes = [...parId.values()];
if (lignes.length === 0) throw new Error(`Aucun article (${erreurs} recherche(s) en échec) : rien n'est modifié.`);

for (let i = 0; i < lignes.length; i += 500) {
  const r = await fetch(`${base}/rest/v1/articles?on_conflict=source,id_source`, {
    method: 'POST',
    headers: { ...entetes, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(lignes.slice(i, i + 500)),
  });
  if (!r.ok) throw new Error(`Écriture : HTTP ${r.status} ${await r.text()}`);
}

// Les articles web absents de cet import ne sont plus proposés.
const off = await fetch(`${base}/rest/v1/articles?source=eq.web&maj_at=lt.${encodeURIComponent(debut)}`, {
  method: 'PATCH',
  headers: { ...entetes, Prefer: 'return=minimal' },
  body: JSON.stringify({ actif: false }),
});
if (!off.ok) throw new Error(`Désactivation : HTTP ${off.status}`);
console.log(`${lignes.length} articles web importés, ${erreurs} recherche(s) en échec.`);
