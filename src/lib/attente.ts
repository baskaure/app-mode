// Attente pendant la génération d'un essayage. Sans import : testé par attente.test.ts (npm test).
// Durée mesurée en production le 15 oct. 2026 : de 77 à 153 s, médiane 114 s (GPT Image 2.5 Sunburst via Kie).
export const DUREE_ATTENDUE_MS = 115_000;

// Avance de la barre, de 0 à 0,95 : elle suit le temps attendu, puis ralentit pour ne jamais se figer à 100 %
// tant que l'image n'est pas là.
export function progression(ecouleMs: number, attenduMs = DUREE_ATTENDUE_MS): number {
  if (ecouleMs <= 0) return 0;
  const t = ecouleMs / attenduMs;
  const p = t <= 1 ? 0.85 * t : 0.85 + 0.1 * (1 - Math.exp(-(t - 1) * 2));
  return Math.min(0.95, p);
}

export function tempsRestant(ecouleMs: number, attenduMs = DUREE_ATTENDUE_MS): string {
  const reste = Math.round((attenduMs - ecouleMs) / 1000);
  if (reste <= 10) return 'Presque fini…';
  if (reste < 60) return `Encore environ ${Math.ceil(reste / 10) * 10} s`;
  const minutes = Math.floor(reste / 60);
  const secondes = reste % 60 >= 30 ? ' 30' : '';
  return `Encore environ ${minutes} min${secondes}`;
}

// Ce qu'on fait lire pendant l'attente : les conseils de la silhouette, puis des astuces de l'app.
export function messagesAttente(objectif: string | null, aPrivilegier: string[]): string[] {
  const conseils = aPrivilegier.map((p) => `À privilégier pour toi : ${p}.`);
  return [
    ...(objectif ? [objectif] : []),
    ...conseils,
    'Astuce : depuis n’importe quelle app de shopping, partage l’article vers Akalie pour l’essayer.',
    'Astuce : ajoute tes pièces au dressing, l’onglet Inspirations te propose ce qui va avec.',
  ];
}

// Étapes réelles du serveur (fonction essayage), montrées pendant l'attente (15 oct. 2026) : vérification des
// photos (Claude Haiku), génération (Kie.ai), vérification du résultat, enregistrement. Seuils en part du
// temps attendu, estimés sur les mesures du 15 oct. : la génération prend l'essentiel.
export const ETAPES_GENERATION = [
  { libelle: 'Vérification de tes photos', jusqua: 0.06 },
  { libelle: 'L’IA crée ton image', jusqua: 0.88 },
  { libelle: 'Vérification du résultat', jusqua: 0.96 },
  { libelle: 'Enregistrement', jusqua: Infinity },
] as const;

// Index de l'étape en cours (la dernière reste affichée tant que l'image n'est pas là).
export function etapeEnCours(ecouleMs: number, attenduMs = DUREE_ATTENDUE_MS): number {
  const t = ecouleMs / attenduMs;
  const i = ETAPES_GENERATION.findIndex((e) => t < e.jusqua);
  return i === -1 ? ETAPES_GENERATION.length - 1 : i;
}
