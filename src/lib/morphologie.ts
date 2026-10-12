// Silhouettes du conseil en image, déduites de 3 réponses simples (aucune photo du corps en V1).

export type Silhouette = 'A' | 'V' | 'H' | 'X' | 'O';
export type Vestiaire = 'femme' | 'homme';

export type EpaulesHanches = 'epaules_plus_larges' | 'pareil' | 'hanches_plus_larges';
export type Taille = 'marquee' | 'un_peu' | 'pas_marquee';
export type Ventre = 'plat' | 'un_peu' | 'marque';

export type ReponsesMorpho = {
  epaulesHanches: EpaulesHanches;
  taille: Taille;
  ventre: Ventre;
};

export function deduireSilhouette(
  { epaulesHanches, taille, ventre }: ReponsesMorpho,
  vestiaire: Vestiaire = 'femme',
): Silhouette {
  if (ventre === 'marque' && taille === 'pas_marquee') return 'O';
  if (epaulesHanches === 'hanches_plus_larges') return 'A';
  if (epaulesHanches === 'epaules_plus_larges') return 'V';
  // La silhouette en X n'est pas utilisée côté hommes : ramenée à H.
  return taille === 'marquee' && vestiaire === 'femme' ? 'X' : 'H';
}

type Conseil = { nom: string; objectif: string; aPrivilegier: string[]; aEviter: string[] };

export function conseilPour(silhouette: Silhouette, vestiaire: Vestiaire): Conseil {
  return vestiaire === 'homme' ? CONSEILS_HOMME[silhouette] : CONSEILS[silhouette];
}

// Règles de base, servent de garde-fou au modèle IA et de texte « pourquoi ça te va ».
export const CONSEILS: Record<Silhouette, Conseil> = {
  A: {
    nom: 'Silhouette en A',
    objectif: 'Équilibrer le haut et le bas en donnant du volume aux épaules.',
    aPrivilegier: ['hauts clairs ou à motifs', 'encolures bateau ou carrées', 'jeans droits ou évasés', 'jupes trapèze'],
    aEviter: ['pantalons moulants clairs', 'poches ou volumes sur les hanches'],
  },
  V: {
    nom: 'Silhouette en V',
    objectif: 'Alléger le haut et donner du volume au bas.',
    aPrivilegier: ['encolures en V', 'hauts sombres et fluides', 'pantalons larges ou cargo', 'jupes évasées'],
    aEviter: ['épaulettes', 'manches bouffantes', 'motifs chargés en haut'],
  },
  H: {
    nom: 'Silhouette en H',
    objectif: 'Créer une taille et des courbes.',
    aPrivilegier: ['ceintures', 'hauts rentrés', 'vestes cintrées', 'jupes portefeuille'],
    aEviter: ['coupes droites de la tête aux pieds', 'robes sac sans ceinture'],
  },
  X: {
    nom: 'Silhouette en X',
    objectif: 'Suivre et marquer la taille sans ajouter de volume.',
    aPrivilegier: ['coupes cintrées', 'robes portefeuille', 'jeans taille haute', 'ceintures'],
    aEviter: ['vêtements trop amples qui cachent la taille'],
  },
  O: {
    nom: 'Silhouette en O',
    objectif: 'Allonger la silhouette et dégager le milieu du corps.',
    aPrivilegier: ['hauts fluides non rentrés', 'encolures en V', 'vestes ouvertes et longues', 'pantalons droits'],
    aEviter: ['hauts rentrés serrés', 'ceintures à la taille', 'matières moulantes au ventre'],
  },
};

export const CONSEILS_HOMME: Record<Silhouette, Conseil> = {
  A: {
    nom: 'Silhouette en triangle',
    objectif: 'Élargir les épaules et affiner le bas.',
    aPrivilegier: ['vestes structurées', 'chemises à poches poitrine', 'rayures horizontales en haut', 'pantalons droits sombres'],
    aEviter: ['pantalons slim clairs', 'hauts trop moulants'],
  },
  V: {
    nom: 'Silhouette en V',
    objectif: 'Garder l’équilibre sans surcharger le haut.',
    aPrivilegier: ['t-shirts ajustés', 'encolures en V', 'pantalons droits ou larges', 'couleurs claires en bas'],
    aEviter: ['épaulettes marquées', 'pantalons très slim'],
  },
  H: {
    nom: 'Silhouette en H',
    objectif: 'Donner de la structure et une ligne d’épaules.',
    aPrivilegier: ['superpositions (surchemise, veste)', 'vestes structurées', 'pantalons droits', 'pulls à col'],
    aEviter: ['tenues ton sur ton trop amples'],
  },
  X: {
    nom: 'Silhouette en H',
    objectif: 'Donner de la structure et une ligne d’épaules.',
    aPrivilegier: ['superpositions (surchemise, veste)', 'vestes structurées', 'pantalons droits', 'pulls à col'],
    aEviter: ['tenues ton sur ton trop amples'],
  },
  O: {
    nom: 'Silhouette en O',
    objectif: 'Allonger la silhouette et alléger le milieu du corps.',
    aPrivilegier: ['couleurs sombres unies en haut', 'vestes ouvertes', 'cols en V', 'pantalons droits taille normale'],
    aEviter: ['t-shirts moulants', 'grosses rayures horizontales', 'ceintures contrastées'],
  },
};
