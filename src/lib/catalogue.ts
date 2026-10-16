import type { Article } from '@/lib/catalogue-regles';
import type { Vestiaire } from '@/lib/morphologie';
import { supabase } from '@/lib/supabase';

export type { Article } from '@/lib/catalogue-regles';

// Articles du catalogue pour un vestiaire (et les mixtes). La base ne renvoie que les articles actifs ; ceux de la
// sélection « test » ne sont visibles que des comptes testeurs (migration 000014).
const LIMITE = 300;

export async function listerArticles(vestiaire: Vestiaire | null): Promise<Article[]> {
  let requete = supabase
    .from('articles')
    .select('id, source, marchand, marque, nom, nom_court, coupe, prix, devise, image_url, lien, categorie, couleur, vestiaire, styles')
    .order('maj_at', { ascending: false })
    .limit(LIMITE);
  if (vestiaire) requete = requete.in('vestiaire', [vestiaire, 'mixte']);
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return (data ?? []).map((a) => ({ ...a, prix: a.prix === null ? null : Number(a.prix) })) as Article[];
}

export async function lireArticle(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('id, source, marchand, marque, nom, nom_court, coupe, prix, devise, image_url, lien, categorie, couleur, vestiaire, styles')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? ({ ...data, prix: data.prix === null ? null : Number(data.prix) } as Article) : null;
}
