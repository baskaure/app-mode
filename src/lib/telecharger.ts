// Enregistre une image d'essayage dans la galerie du téléphone (idée du 13 oct. 2026).
// Le lien signé est d'abord téléchargé dans le cache, puis ajouté à la galerie (accès en écriture seule).
// Version web : telecharger.web.ts.
import { File, Paths } from 'expo-file-system';
import { Asset, requestPermissionsAsync } from 'expo-media-library';

export class AccesRefuse extends Error {}

export async function enregistrerImage(url: string, nom: string): Promise<void> {
  const { granted } = await requestPermissionsAsync(true, ['photo']);
  if (!granted) throw new AccesRefuse('Autorise l’accès à tes photos dans les réglages pour enregistrer l’image.');
  const fichier = await File.downloadFileAsync(url, new File(Paths.cache, nom), { idempotent: true });
  try {
    await Asset.create(fichier.uri);
  } finally {
    fichier.delete();
  }
}
