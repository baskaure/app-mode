import { compresser, idUtilisateur, lireOctets, nomFichier, type Photo } from '@/lib/photos';
import { supabase } from '@/lib/supabase';

export { choisirPhoto, type Photo, type Source } from '@/lib/photos';

// Photos des pièces : compressées (~150 Ko), rangées dans le bucket privé `pieces` sous <uid>/<fichier>.jpg.
const BUCKET = 'pieces';
const LARGEUR_MAX = 1080;
const COMPRESSION = 0.7;
const DUREE_LIEN_S = 60 * 60;

export type Categorie = 'haut' | 'bas' | 'robe' | 'veste' | 'chaussures' | 'accessoire';

export type Piece = {
  id: string;
  photo_path: string;
  categorie: Categorie | null;
  created_at: string;
  url: string | null;
};

export async function ajouterPiece(photo: Photo): Promise<void> {
  const uid = await idUtilisateur();
  const octets = await lireOctets((await compresser(photo, LARGEUR_MAX, COMPRESSION)).uri);
  const chemin = nomFichier(uid);

  const envoi = await supabase.storage.from(BUCKET).upload(chemin, octets, { contentType: 'image/jpeg' });
  if (envoi.error) throw new Error(`Envoi de la photo impossible : ${envoi.error.message}`);

  const ligne = await supabase.from('pieces').insert({ photo_path: chemin });
  if (ligne.error) {
    await supabase.storage.from(BUCKET).remove([chemin]);
    throw new Error(`Enregistrement impossible : ${ligne.error.message}`);
  }
}

export async function listerPieces(): Promise<Piece[]> {
  const { data, error } = await supabase
    .from('pieces')
    .select('id, photo_path, categorie, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  if (!data.length) return [];

  const liens = await supabase.storage.from(BUCKET).createSignedUrls(
    data.map((p) => p.photo_path),
    DUREE_LIEN_S,
  );
  const urlParChemin = new Map((liens.data ?? []).map((l) => [l.path, l.signedUrl]));
  return data.map((p) => ({ ...p, url: urlParChemin.get(p.photo_path) ?? null }));
}

export async function supprimerPiece(piece: Piece): Promise<void> {
  // Les essais faits avec cette pièce lisent sa photo : on les supprime avec elle, images de résultat comprises
  // (sinon elles resteraient dans le bucket `essayages` sans aucune ligne qui les désigne).
  const essais = await supabase.from('essais').delete().eq('piece_id', piece.id).select('resultat_path');
  if (essais.error) throw new Error(essais.error.message);
  const resultats = essais.data.map((e) => e.resultat_path).filter((c): c is string => !!c);
  if (resultats.length) await supabase.storage.from('essayages').remove(resultats);
  const { error } = await supabase.from('pieces').delete().eq('id', piece.id);
  if (error) throw new Error(error.message);
  await supabase.storage.from(BUCKET).remove([piece.photo_path]);
}
