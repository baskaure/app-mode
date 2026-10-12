import { FunctionsHttpError } from '@supabase/supabase-js';

import type { Avis } from '@/lib/avis';
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
  // Lien de l'image d'essayage, si l'essai est déjà fait (rouvert depuis l'historique).
  urlResultat: string | null;
  avis: Avis | null;
  // Adresse de l'article quand le vêtement vient d'un lien (sinon null : photo, capture, dressing).
  lien_url: string | null;
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

// « J'aime / j'aime pas » (null = pas d'avis). Seule colonne modifiable par l'app ; la date est posée par la base
// (migrations 000007 et 000008).
export async function donnerAvis(essaiId: string, avis: Avis | null): Promise<void> {
  const { error } = await supabase
    .from('essais')
    .update({ avis })
    .eq('id', essaiId);
  if (error) throw new Error(`Avis non enregistré : ${error.message}`);
}

export async function lireEssai(id: string): Promise<Essai> {
  const { data, error } = await supabase
    .from('essais')
    .select('id, source, vetement_bucket, vetement_path, statut, resultat_path, avis, lien_url')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  const { resultat_path, ...essai } = data;
  const lien = await supabase.storage.from(data.vetement_bucket).createSignedUrl(data.vetement_path, DUREE_LIEN_S);
  const resultat = resultat_path
    ? await supabase.storage.from('essayages').createSignedUrl(resultat_path, DUREE_LIEN_S)
    : null;
  return {
    ...(essai as Omit<Essai, 'url' | 'urlResultat'>),
    url: lien.data?.signedUrl ?? null,
    urlResultat: resultat?.data?.signedUrl ?? null,
  };
}

// L'essayage offert est utilisé : l'écran doit ouvrir le paywall (réponse 402 du serveur, code « abonnement »).
export class AbonnementRequis extends Error {}

type ReponseEssayage = { statut: Essai['statut']; resultat_path?: string | null; message?: string | null };

async function appelerEssayage(action: 'lancer' | 'suivre', essaiId: string): Promise<ReponseEssayage> {
  const { data, error } = await supabase.functions.invoke<ReponseEssayage>('essayage', {
    body: { action, essai_id: essaiId },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const corps = await error.context.json().catch(() => null);
      if (corps?.code === 'abonnement') throw new AbonnementRequis(corps.erreur ?? 'Abonne-toi pour continuer.');
      throw new Error(corps?.erreur ?? 'L’essayage n’a pas pu démarrer.');
    }
    throw new Error('Impossible de joindre le serveur. Vérifie ta connexion.');
  }
  if (!data) throw new Error('Réponse inattendue du serveur.');
  return data;
}

// Lance l'essayage puis interroge le serveur toutes les 3 s, au plus 3 minutes. Renvoie le lien de l'image.
export async function essayer(essaiId: string, onEtape?: (etape: string) => void): Promise<string> {
  onEtape?.('Envoi au service d’essayage…');
  let etat = await appelerEssayage('lancer', essaiId);
  const fin = Date.now() + 3 * 60 * 1000;
  while (etat.statut === 'en_cours' && Date.now() < fin) {
    onEtape?.('L’IA t’habille… (jusqu’à 2 minutes)');
    await new Promise((r) => setTimeout(r, 3000));
    etat = await appelerEssayage('suivre', essaiId);
  }
  if (etat.statut === 'erreur' || etat.statut === 'refuse') throw new Error(etat.message ?? 'L’essayage a échoué.');
  if (etat.statut !== 'fait' || !etat.resultat_path) throw new Error('L’essayage prend trop de temps. Réessaie plus tard.');

  const lien = await supabase.storage.from('essayages').createSignedUrl(etat.resultat_path, DUREE_LIEN_S);
  if (!lien.data) throw new Error('Image du résultat introuvable.');
  return lien.data.signedUrl;
}
