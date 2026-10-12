import { Linking } from 'react-native';

import type { Marchand } from '@/lib/affiliation';
import { supabase } from '@/lib/supabase';

// Identifiant d'éditeur Awin (« awinaffid ») : public, il figure dans chaque lien affilié.
export const ID_EDITEUR_AWIN = process.env.EXPO_PUBLIC_AWIN_ID_EDITEUR || undefined;

let cache: Promise<Marchand[]> | null = null;

// Marchands affiliés actifs (table marchands_affilies), lus une fois par lancement. En cas d'erreur, liste vide :
// le bouton ouvre alors l'article sans affiliation.
export function chargerMarchands(): Promise<Marchand[]> {
  cache ??= (async () => {
    const { data, error } = await supabase.from('marchands_affilies').select('domaine, reseau, id_annonceur');
    if (error) {
      cache = null;
      return [];
    }
    return data as Marchand[];
  })();
  return cache;
}

// Navigateur du téléphone (pas le navigateur intégré) : le cookie d'attribution d'Awin doit être là où l'achat se fait.
export async function ouvrirAchat(url: string): Promise<void> {
  await Linking.openURL(url);
}
