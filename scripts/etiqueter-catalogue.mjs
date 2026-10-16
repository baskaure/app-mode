// Étiquetage par l'IA des articles pas encore vus (Edge Function etiqueter-articles, 90 par passage) : nom court,
// couleur, coupe, et désactivation des articles hors sujet. Appelé à la fin de importer-web.mjs, ou seul :
//
//   SUPABASE_SERVICE_ROLE_KEY="…" node scripts/etiqueter-catalogue.mjs
//
// Seul, il ne relance aucune recherche SerpApi (workflow « Étiqueter le catalogue »).

// S'arrête quand tout est fait ou que rien n'avance (articles que l'IA ne sait pas traiter).
export async function etiqueterCatalogue(base, cle) {
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' };
  for (let passage = 1; passage <= 15; passage++) {
    const r = await fetch(`${base}/functions/v1/etiqueter-articles`, { method: 'POST', headers: entetes, signal: AbortSignal.timeout(150000) });
    if (!r.ok) throw new Error(`Étiquetage : HTTP ${r.status} ${await r.text()}`);
    const bilan = await r.json();
    console.log(
      `Étiquetage ${passage} : ${bilan.gardes} gardés, ${bilan.ecartes} écartés, ${bilan.echecs} en échec, ${bilan.restants} restants.` +
        (bilan.erreur ? ` Erreur : ${bilan.erreur}` : ''),
    );
    if (!bilan.restants || bilan.gardes + bilan.ecartes === 0) return;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://ccqlylvpqugdixqojjxk.supabase.co';
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!cle) throw new Error('Variable manquante : SUPABASE_SERVICE_ROLE_KEY');
  await etiqueterCatalogue(base, cle);
}
