import { compresser, idUtilisateur, lireOctets, nomFichier, type Photo } from '@/lib/photos';
import { supabase } from '@/lib/supabase';

// Photo de soi pour l'essayage : une seule par utilisateur, bucket privé `silhouettes`.
// Plus grande que les photos de vêtements, car le modèle d'essayage a besoin de détails.
const BUCKET = 'silhouettes';
const LARGEUR_MAX = 1280;
const COMPRESSION = 0.85;
const DUREE_LIEN_S = 60 * 60;

export type Silhouette = { chemin: string; url: string | null };

// Le format attendu : en pied, en hauteur. On refuse une photo en largeur (sans doute pas en pied).
export function verifierCadrage({ width, height }: Photo): string | null {
  if (width && height && width >= height) {
    return 'Prends la photo en hauteur, de la tête aux pieds.';
  }
  return null;
}

export async function lireSilhouette(): Promise<Silhouette | null> {
  const uid = await idUtilisateur();
  const { data, error } = await supabase.from('profils').select('photo_soi_path').eq('id', uid).maybeSingle();
  if (error) throw new Error(error.message);
  const chemin = data?.photo_soi_path as string | null | undefined;
  if (!chemin) return null;
  const lien = await supabase.storage.from(BUCKET).createSignedUrl(chemin, DUREE_LIEN_S);
  return { chemin, url: lien.data?.signedUrl ?? null };
}

// Enregistre la nouvelle photo et le consentement, puis efface l'ancienne photo.
export async function enregistrerSilhouette(photo: Photo): Promise<void> {
  const uid = await idUtilisateur();
  const ancienne = await lireSilhouette();
  const octets = await lireOctets((await compresser(photo, LARGEUR_MAX, COMPRESSION)).uri);
  const chemin = nomFichier(uid);

  const envoi = await supabase.storage.from(BUCKET).upload(chemin, octets, { contentType: 'image/jpeg' });
  if (envoi.error) throw new Error(`Envoi de la photo impossible : ${envoi.error.message}`);

  const maj = await supabase
    .from('profils')
    .update({ photo_soi_path: chemin, consentement_photo_at: new Date().toISOString() })
    .eq('id', uid);
  if (maj.error) {
    await supabase.storage.from(BUCKET).remove([chemin]);
    throw new Error(`Enregistrement impossible : ${maj.error.message}`);
  }
  if (ancienne) await supabase.storage.from(BUCKET).remove([ancienne.chemin]);
}

export async function supprimerSilhouette(): Promise<void> {
  const uid = await idUtilisateur();
  const actuelle = await lireSilhouette();
  const maj = await supabase.from('profils').update({ photo_soi_path: null }).eq('id', uid);
  if (maj.error) throw new Error(maj.error.message);
  if (actuelle) await supabase.storage.from(BUCKET).remove([actuelle.chemin]);
}
