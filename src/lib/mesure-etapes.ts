// Étapes du parcours mesurées (15 oct. 2026), dans l'ordre de l'entonnoir. Sans import : testé par
// mesure-etapes.test.ts, qui vérifie aussi que la liste est identique à la contrainte de la table evenements.
export const ETAPES = [
  'questionnaire_ouvert',
  'questionnaire_fini',
  'photo_ajoutee',
  'vetement_choisi',
  'essai_lance',
  'essai_reussi',
  'paywall_vu',
  'abonnement',
] as const;

// Gestes mesurés à côté de l'entonnoir (usage des fonctions, pas des étapes).
export const GESTES = ['piece_ajoutee', 'article_ouvert', 'story_partagee'] as const;

export type Evenement = (typeof ETAPES)[number] | (typeof GESTES)[number];
