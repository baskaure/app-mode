import { FunctionsHttpError } from '@supabase/supabase-js';

import type { Piece } from '@/lib/dressing';
import { compresser, idUtilisateur, lireOctets, nomFichier, type Photo } from '@/lib/photos';
import { supabase } from '@/lib/supabase';

// Un essai = un vêtement choisi pour être essayé sur la photo de soi (table public.essais).
const LARGEUR_MAX = 1280;
const COMPRESSION = 0.85;
const DUREE_LIEN_S = 60 * 60;

export type Essai = {
  id: string;
  source: 'photo' | 'lien' | 'dressing';
  vetement_bucket: 'vetements' | 'pieces';
  vetement_path: string;
  statut: 'a_faire' | 'en_cours' | 'fait' | 'refuse' | 'erreur';
  url: string | null;
};

export async function essaiDepuisPhoto(photo: Photo): Promise<string> {
  const uid = await idUtilisateur();
  const octets = await lireOctets((await compresser(photo, LARGEUR_MAX, COMPRESSION)).uri);
  const chemin = nomFichier(uid);
  const envoi = await supabase.storage.from('vetements').upload(chemin, octets, { contentType: 'image/jpeg' });
  if (envoi.error) throw new Error(`Envoi de la photo impossible : ${envoi.error.message}`);

  const { data, error } = await supabase
    .from('essais')
    .insert({ source: 'photo', vetement_bucket: 'vetements', vetement_path: chemin })
    .select('id')
    .single();
  if (error) {
    await supabase.storage.from('vetements').remove([chemin]);
    throw new Error(`Création de l’essai impossible : ${error.message}`);
  }
  return data.id;
}

// L'image est lue côté serveur (Edge Function extraire-vetement) : l'app ne peut pas lire la page d'un autre site.
export async function essaiDepuisLien(lien: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ essai_id: string }>('extraire-vetement', {
    body: { url: lien.trim() },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const corps = await error.context.json().catch(() => null);
      throw new Error(corps?.erreur ?? 'Impossible de lire ce lien.');
    }
    throw new Error('Impossible de joindre le serveur. Vérifie ta connexion.');
  }
  if (!data?.essai_id) throw new Error('Réponse inattendue du serveur.');
  return data.essai_id;
}

export async function essaiDepuisPiece(piece: Piece): Promise<string> {
  const { data, error } = await supabase
    .from('essais')
    .insert({ source: 'dressing', vetement_bucket: 'pieces', vetement_path: piece.photo_path, piece_id: piece.id })
    .select('id')
    .single();
  if (error) throw new Error(`Création de l’essai impossible : ${error.message}`);
  return data.id;
}

export async function lireEssai(id: string): Promise<Essai> {
  const { data, error } = await supabase
    .from('essais')
    .select('id, source, vetement_bucket, vetement_path, statut')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  const lien = await supabase.storage.from(data.vetement_bucket).createSignedUrl(data.vetement_path, DUREE_LIEN_S);
  return { ...(data as Omit<Essai, 'url'>), url: lien.data?.signedUrl ?? null };
}
