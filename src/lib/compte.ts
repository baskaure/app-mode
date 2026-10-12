import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

// « Supprimer toutes mes données » : tout se fait côté serveur (Edge Function supprimer-compte),
// car l'app n'a pas le droit d'effacer son propre compte ni les copies de travail du serveur.

// L'utilisateur a un abonnement actif : l'effacer ne le résilie pas chez Apple ou Google (réponse 409).
export class AbonnementActif extends Error {}

export async function supprimerToutesMesDonnees(malgreAbonnement = false): Promise<void> {
  const { error } = await supabase.functions.invoke('supprimer-compte', {
    body: { malgre_abonnement: malgreAbonnement },
  });
  if (!error) return;
  if (error instanceof FunctionsHttpError) {
    const corps = await error.context.json().catch(() => null);
    if (corps?.code === 'abonne_actif') throw new AbonnementActif(corps.erreur);
    throw new Error(corps?.erreur ?? 'La suppression n’a pas abouti. Réessaie.');
  }
  throw new Error('Impossible de joindre le serveur. Vérifie ta connexion.');
}

export async function monIdentifiant(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
