// Silhouettes du conseil en image, déduites de 3 réponses simples (aucune photo du corps en V1).

export type Silhouette = 'A' | 'V' | 'H' | 'X' | 'O';

export type EpaulesHanches = 'epaules_plus_larges' | 'pareil' | 'hanches_plus_larges';
export type Taille = 'marquee' | 'un_peu' | 'pas_marquee';
export type Ventre = 'plat' | 'un_peu' | 'marque';

export type ReponsesMorpho = {
  epaulesHanches: EpaulesHanches;
  taille: Taille;
  ventre: Ventre;
};

export function deduireSilhouette({ epaulesHanches, taille, ventre }: ReponsesMorpho): Silhouette {
  if (ventre === 'marque' && taille === 'pas_marquee') return 'O';
  if (epaulesHanches === 'hanches_plus_larges') return 'A';
  if (epaulesHanches === 'epaules_plus_larges') return 'V';
  return taille === 'marquee' ? 'X' : 'H';
}

// Règles de base, servent de garde-fou au modèle IA et de texte « pourquoi ça te va ».
export const CONSEILS: Record<Silhouette, { nom: string; objectif: string; aPrivilegier: string[]; aEviter: string[] }> = {
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
