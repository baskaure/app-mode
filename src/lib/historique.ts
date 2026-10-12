import { fichiersDeLEssai, supprimable, type LigneEssai } from '@/lib/historique-regles';
import { supabase } from '@/lib/supabase';

// Historique des essayages (table public.essais). Les 50 plus récents, avec des liens d'images valables 1 h.
const LIMITE = 50;
const DUREE_LIEN_S = 60 * 60;

export type EssaiHistorique = LigneEssai & { urlVetement: string | null; urlResultat: string | null };

async function liens(bucket: string, chemins: string[]): Promise<Map<string, string>> {
  if (!chemins.length) return new Map();
  const { data } = await supabase.storage.from(bucket).createSignedUrls(chemins, DUREE_LIEN_S);
  const paires: [string, string][] = [];
  for (const l of data ?? []) if (l.path && l.signedUrl) paires.push([l.path, l.signedUrl]);
  return new Map(paires);
}

export async function listerEssais(): Promise<EssaiHistorique[]> {
  const { data, error } = await supabase
    .from('essais')
    .select('id, statut, vetement_bucket, vetement_path, resultat_path, created_at')
    .order('created_at', { ascending: false })
    .limit(LIMITE);
  if (error) throw new Error(error.message);
  const lignes = data as LigneEssai[];

  const cheminsDe = (bucket: LigneEssai['vetement_bucket']) =>
    lignes.filter((e) => e.vetement_bucket === bucket).map((e) => e.vetement_path);
  const [vetements, pieces, resultats] = await Promise.all([
    liens('vetements', cheminsDe('vetements')),
    liens('pieces', cheminsDe('pieces')),
    liens('essayages', lignes.flatMap((e) => (e.resultat_path ? [e.resultat_path] : []))),
  ]);

  return lignes.map((e) => ({
    ...e,
    urlVetement: (e.vetement_bucket === 'pieces' ? pieces : vetements).get(e.vetement_path) ?? null,
    urlResultat: e.resultat_path ? (resultats.get(e.resultat_path) ?? null) : null,
  }));
}

// Efface l'essai et ses images (résultat, photo du vêtement envoyée). Le compteur d'essayages du mois
// (journal côté serveur) n'est pas touché : supprimer un essai ne rend pas d'essayage offert.
export async function supprimerEssai(e: LigneEssai): Promise<void> {
  if (!supprimable(e)) throw new Error('Cet essayage est en cours : attends qu’il soit fini pour le supprimer.');
  // Le statut est revérifié en base : la liste affichée peut dater (autre appareil, essayage lancé entre-temps).
  const { data, error } = await supabase.from('essais').delete().eq('id', e.id).neq('statut', 'en_cours').select('id');
  if (error) throw new Error(`Suppression impossible : ${error.message}`);
  if (!data.length) throw new Error('Cet essayage est en cours ou déjà supprimé. Rafraîchis la liste.');
  const parBucket = new Map<string, string[]>();
  for (const f of fichiersDeLEssai(e)) parBucket.set(f.bucket, [...(parBucket.get(f.bucket) ?? []), f.chemin]);
  const envois = await Promise.all([...parBucket].map(([bucket, chemins]) => supabase.storage.from(bucket).remove(chemins)));
  if (envois.some((r) => r.error)) {
    throw new Error('Essayage supprimé, mais une image n’a pas pu être effacée. « Supprimer toutes mes données » l’effacera.');
  }
}
