// Importe un flux produits Awin dans la table articles (source 'awin'), puis désactive les articles du flux
// qui n'y sont plus. À lancer à la main ou chaque nuit, une fois le compte éditeur Awin accepté.
//
//   AWIN_FLUX_URL="https://productdata.awin.com/datafeed/download/apikey/…/format/csv/…" \
//   SUPABASE_SERVICE_ROLE_KEY="…" node scripts/importer-awin.mjs
//
// AWIN_FLUX_URL : lien « Create-a-Feed » de l'espace éditeur Awin (CSV, compressé ou non).
// SUPABASE_SERVICE_ROLE_KEY : clé serveur Supabase (Réglages > API). Ne jamais la mettre dans l'app.
// L'URL du projet est lue dans EXPO_PUBLIC_SUPABASE_URL (.env.local).
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

import { lireCsv, versArticle } from '../src/lib/awin.ts';

const LOT = 500;

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

const flux = env('AWIN_FLUX_URL');
const base = env('EXPO_PUBLIC_SUPABASE_URL');
const cle = env('SUPABASE_SERVICE_ROLE_KEY');
const entetes = { apikey: cle, Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' };

const debut = new Date().toISOString();
const reponse = await fetch(flux);
if (!reponse.ok) throw new Error(`Flux Awin : HTTP ${reponse.status}`);
let octets = Buffer.from(await reponse.arrayBuffer());
if (octets[0] === 0x1f && octets[1] === 0x8b) octets = gunzipSync(octets);

const lignes = lireCsv(octets.toString('utf8'));
const articles = [...new Map(lignes.map(versArticle).filter(Boolean).map((a) => [a.id_source, a])).values()];
console.log(`${lignes.length} lignes lues, ${articles.length} articles retenus.`);

for (let i = 0; i < articles.length; i += LOT) {
  const lot = articles.slice(i, i + LOT).map((a) => ({ ...a, actif: true, maj_at: new Date().toISOString() }));
  const r = await fetch(`${base}/rest/v1/articles?on_conflict=source,id_source`, {
    method: 'POST',
    headers: { ...entetes, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(lot),
  });
  if (!r.ok) throw new Error(`Envoi du lot ${i / LOT + 1} : HTTP ${r.status} ${await r.text()}`);
}

// Les articles Awin absents de ce flux (épuisés, retirés) ne sont plus proposés.
const retrait = await fetch(`${base}/rest/v1/articles?source=eq.awin&maj_at=lt.${encodeURIComponent(debut)}`, {
  method: 'PATCH',
  headers: { ...entetes, Prefer: 'return=minimal' },
  body: JSON.stringify({ actif: false }),
});
if (!retrait.ok) throw new Error(`Désactivation des anciens articles : HTTP ${retrait.status}`);
console.log('Import terminé.');
