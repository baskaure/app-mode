// Règles de l'historique des essayages. Sans import : testé par historique-regles.test.ts (npm test).

export type Statut = 'a_faire' | 'en_cours' | 'fait' | 'refuse' | 'erreur';

export type LigneEssai = {
  id: string;
  statut: Statut;
  vetement_bucket: 'vetements' | 'pieces';
  vetement_path: string;
  resultat_path: string | null;
  created_at: string;
  avis: 'aime' | 'aime_pas' | null;
};

export function libelleStatut(statut: Statut): string {
  switch (statut) {
    case 'fait':
      return 'Essayé';
    case 'en_cours':
      return 'En cours…';
    case 'refuse':
      return 'Refusé';
    case 'erreur':
      return 'Échec';
    default:
      return 'Pas encore essayé';
  }
}

// Fichiers à effacer avec un essai. La photo d'une pièce du dressing reste : elle appartient au dressing.
export function fichiersDeLEssai(e: LigneEssai): { bucket: 'vetements' | 'essayages'; chemin: string }[] {
  const fichiers: { bucket: 'vetements' | 'essayages'; chemin: string }[] = [];
  if (e.resultat_path) fichiers.push({ bucket: 'essayages', chemin: e.resultat_path });
  if (e.vetement_bucket === 'vetements') fichiers.push({ bucket: 'vetements', chemin: e.vetement_path });
  return fichiers;
}

// Un essai en cours ne se supprime pas : Kling travaille encore dessus et déposerait un résultat orphelin.
export function supprimable(e: Pick<LigneEssai, 'statut'>): boolean {
  return e.statut !== 'en_cours';
}

// « Aujourd'hui », « Hier », ou la date courte (12 oct.), dans le fuseau du téléphone.
export function dateCourte(iso: string, maintenant: Date): string {
  const d = new Date(iso);
  const jour = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const ecart = Math.round((jour(maintenant) - jour(d)) / 86_400_000);
  if (ecart === 0) return 'Aujourd’hui';
  if (ecart === 1) return 'Hier';
  const mois = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const annee = d.getFullYear() === maintenant.getFullYear() ? '' : ` ${d.getFullYear()}`;
  return `${d.getDate()} ${mois[d.getMonth()]}${annee}`;
}
