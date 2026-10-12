import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// Photos des pièces : compressées (~200 Ko), rangées dans le bucket privé `pieces` sous <uid>/<fichier>.jpg.
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

export type Source = 'camera' | 'galerie';

export type Photo = { uri: string; width: number; height: number };

// Renvoie la photo choisie, ou null si l'utilisateur annule.
export async function choisirPhoto(source: Source): Promise<Photo | null> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };

  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (Platform.OS !== 'web' && !permission.granted) {
      throw new Error('Accès à l’appareil photo refusé. Tu peux l’autoriser dans les réglages du téléphone.');
    }
  }

  const resultat =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (resultat.canceled) return null;
  const { uri, width, height } = resultat.assets[0];
  return { uri, width, height };
}

async function compresser({ uri, width, height }: Photo): Promise<string> {
  // width/height peuvent valoir 0 (doc Expo) : on les lit alors sur l'image.
  if (!width || !height) {
    const original = await ImageManipulator.manipulate(uri).renderAsync();
    width = original.width;
    height = original.height;
  }
  let operation = ImageManipulator.manipulate(uri);
  // Hauteur toujours explicite : sur le web, `height: null` donne une image de hauteur 0.
  if (width > LARGEUR_MAX) {
    operation = operation.resize({ width: LARGEUR_MAX, height: Math.round((height * LARGEUR_MAX) / width) });
  }
  const rendu = await operation.renderAsync();
  const image = await rendu.saveAsync({ format: SaveFormat.JPEG, compress: COMPRESSION });
  return image.uri;
}

async function lireOctets(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') return (await fetch(uri)).arrayBuffer();
  return new File(uri).arrayBuffer();
}

async function idUtilisateur(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Pas de session : relance l’app.');
  return id;
}

export async function ajouterPiece(photo: Photo): Promise<void> {
  const uid = await idUtilisateur();
  const octets = await lireOctets(await compresser(photo));
  const chemin = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

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
  const { error } = await supabase.from('pieces').delete().eq('id', piece.id);
  if (error) throw new Error(error.message);
  await supabase.storage.from(BUCKET).remove([piece.photo_path]);
}
