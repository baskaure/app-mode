// Liste récursive des fichiers d'un dossier de stockage. Sans dépendance : testé par fichiers.test.ts (npm test).
// Le stockage Supabase ne liste qu'un niveau à la fois, par pages ; un dossier y apparaît avec `id: null`.

export type Entree = { name: string; id: string | null };
export type Lister = (dossier: string, offset: number, limite: number) => Promise<Entree[]>;

export const PAGE = 1000;

export async function listerTout(lister: Lister, dossier: string, profondeur = 0): Promise<string[]> {
  // Garde-fou : nos chemins ont au plus 3 niveaux (`uid/essai/fichier`).
  if (profondeur > 5) throw new Error(`stockage:dossier trop profond (${dossier})`);
  const chemins: string[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await lister(dossier, offset, PAGE);
    for (const entree of page) {
      const chemin = `${dossier}/${entree.name}`;
      if (entree.id === null) chemins.push(...(await listerTout(lister, chemin, profondeur + 1)));
      else chemins.push(chemin);
    }
    if (page.length < PAGE) break;
  }
  return chemins;
}

// Découpe une liste en paquets (la suppression du stockage accepte au plus 1 000 chemins par appel).
export function paquets<T>(liste: T[], taille = PAGE): T[][] {
  const resultat: T[][] = [];
  for (let i = 0; i < liste.length; i += taille) resultat.push(liste.slice(i, i + taille));
  return resultat;
}
