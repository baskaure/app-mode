import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// Fonctions photo partagées par le dressing et la photo de soi.

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

// Réduit la photo à `largeurMax` pixels de large et la réencode en JPEG. Renvoie l'URI du résultat.
export async function compresser(
  { uri, width, height }: Photo,
  largeurMax: number,
  compression: number,
): Promise<Photo> {
  // width/height peuvent valoir 0 (doc Expo) : on les lit alors sur l'image.
  if (!width || !height) {
    const original = await ImageManipulator.manipulate(uri).renderAsync();
    width = original.width;
    height = original.height;
  }
  let operation = ImageManipulator.manipulate(uri);
  // Hauteur toujours explicite : sur le web, `height: null` donne une image de hauteur 0.
  if (width > largeurMax) {
    operation = operation.resize({ width: largeurMax, height: Math.round((height * largeurMax) / width) });
  }
  const rendu = await operation.renderAsync();
  const image = await rendu.saveAsync({ format: SaveFormat.JPEG, compress: compression });
  return { uri: image.uri, width: image.width, height: image.height };
}

export async function lireOctets(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') return (await fetch(uri)).arrayBuffer();
  return new File(uri).arrayBuffer();
}

export async function idUtilisateur(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Pas de session : relance l’app.');
  return id;
}

export function nomFichier(uid: string): string {
  return `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
}
