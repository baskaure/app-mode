// Avis sur un essayage. Sans import : testé par avis.test.ts (npm test).

export type Avis = 'aime' | 'aime_pas';

// Toucher le bouton déjà choisi retire l'avis ; toucher l'autre le remplace.
export function basculerAvis(actuel: Avis | null, touche: Avis): Avis | null {
  return actuel === touche ? null : touche;
}

export type Filtre = 'tous' | 'aime';

export function filtrerParAvis<T extends { avis: Avis | null }>(liste: T[], filtre: Filtre): T[] {
  return filtre === 'aime' ? liste.filter((e) => e.avis === 'aime') : liste;
}
