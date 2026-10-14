// Règles de l'analyse d'une pièce du dressing, sans dépendance : testées par regles.test.ts (npm test).
// Les listes doivent rester identiques aux contraintes de la table pieces (migration 000014) et à
// src/lib/catalogue-regles.ts.

export const CATEGORIES = ['haut', 'bas', 'robe', 'veste', 'chaussures', 'accessoire'] as const;
export const COULEURS = [
  'noir', 'blanc', 'beige', 'gris', 'marine', 'bleu', 'marron', 'kaki', 'vert',
  'rouge', 'rose', 'jaune', 'violet', 'orange', 'motif',
] as const;

export type Analyse = {
  est_vetement: boolean;
  categorie: (typeof CATEGORIES)[number];
  couleur: (typeof COULEURS)[number];
  description: string;
};

export type Maj = {
  categorie: (typeof CATEGORIES)[number] | null;
  couleur: (typeof COULEURS)[number] | null;
  description: string | null;
};

export const SCHEMA = {
  type: 'object',
  properties: {
    est_vetement: { type: 'boolean' },
    categorie: { type: 'string', enum: [...CATEGORIES] },
    couleur: { type: 'string', enum: [...COULEURS] },
    description: { type: 'string' },
  },
  required: ['est_vetement', 'categorie', 'couleur', 'description'],
  additionalProperties: false,
};

export const CONSIGNE = `Cette photo vient du dressing d'un utilisateur d'une app de mode : un vêtement posé à plat ou porté.
Décris la pièce principale pour proposer ensuite des articles qui vont avec.

- est_vetement : false si la photo ne montre pas de vêtement, de chaussures ou d'accessoire de mode.
- categorie : haut (t-shirt, chemise, pull, sweat, top), bas (pantalon, jean, jupe, short), robe (robe, combinaison),
  veste (veste, manteau, blazer, gilet), chaussures, accessoire (sac, ceinture, bijou, écharpe, chapeau).
- couleur : la couleur dominante. bleu = bleu moyen ou denim, marine = bleu foncé, motif = imprimé ou plusieurs couleurs.
- description : 2 à 5 mots en français, AVEC le possessif accordé (« ton », « ta » ou « tes ») et la couleur.
  Exemples : « ton jean droit bleu », « ta robe noire », « tes baskets blanches », « ta chemise à rayures ».`;

const DESCRIPTION_MAX = 40;

// Plafond d'analyses par personne et par 24 h (15 oct. 2026) : chaque analyse coûte un appel à Claude Haiku.
// 40 laisse de quoi photographier tout un placard dans la journée, sans laisser un compte tourner en boucle.
export const ANALYSES_MAX_PAR_JOUR = 40;

export function plafondAtteint(analysesDernieres24h: number): boolean {
  return analysesDernieres24h >= ANALYSES_MAX_PAR_JOUR;
}

// Décision prise par le code : valeurs hors liste ou pièce non reconnue → rien d'enregistré (null).
export function normaliser(analyse: Analyse | null): Maj {
  const vide: Maj = { categorie: null, couleur: null, description: null };
  if (!analyse || analyse.est_vetement !== true) return vide;
  if (!(CATEGORIES as readonly string[]).includes(analyse.categorie)) return vide;
  const couleur = (COULEURS as readonly string[]).includes(analyse.couleur) ? analyse.couleur : null;
  const description = analyse.description.trim().replace(/\s+/g, ' ');
  const possessif = /^(ton|ta|tes) \S/i.test(description);
  return {
    categorie: analyse.categorie,
    couleur,
    description: possessif && description.length <= DESCRIPTION_MAX ? description.toLowerCase() : null,
  };
}
