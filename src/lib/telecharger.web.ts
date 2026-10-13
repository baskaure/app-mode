// Version web de telecharger.ts : pas de galerie, le navigateur télécharge le fichier.
export class AccesRefuse extends Error {}

export async function enregistrerImage(url: string, nom: string): Promise<void> {
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error('Téléchargement de l’image impossible.');
  const lien = URL.createObjectURL(await reponse.blob());
  const a = document.createElement('a');
  a.href = lien;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(lien);
}
