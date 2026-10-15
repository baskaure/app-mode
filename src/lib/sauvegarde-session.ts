import * as SecureStore from 'expo-secure-store';

import { supabase } from '@/lib/supabase';

// Garde le compte après une réinstallation (15 oct. 2026). Le compte est anonyme : sa session vivait seulement dans
// le stockage de l'app, effacé par iOS à la désinstallation, et chaque réinstallation recréait un compte vide.
// Le jeton de rafraîchissement est aussi rangé dans le trousseau d'iOS, qui survit en général à la désinstallation
// (doc Expo SecureStore : « not guaranteed »). Au lancement, sans session, on tente de la reprendre avec ce jeton.
// Android : le trousseau est effacé avec l'app, rien ne change.
const CLE = 'akalie.session.rafraichissement';
const OPTIONS = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };

// À appeler une fois : chaque nouveau jeton (connexion, rafraîchissement) remplace l'ancien.
export function suivreSession() {
  const { data } = supabase.auth.onAuthStateChange((evenement, session) => {
    if (session?.refresh_token) void SecureStore.setItemAsync(CLE, session.refresh_token, OPTIONS).catch(() => {});
    else if (evenement === 'SIGNED_OUT') void SecureStore.deleteItemAsync(CLE, OPTIONS).catch(() => {});
  });
  return () => data.subscription.unsubscribe();
}

// Renvoie l'identifiant du compte repris, ou null (pas de jeton, compte supprimé, jeton révoqué).
export async function reprendreSession(): Promise<string | null> {
  try {
    const jeton = await SecureStore.getItemAsync(CLE, OPTIONS);
    if (!jeton) return null;
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: jeton });
    if (error || !data.user) {
      await SecureStore.deleteItemAsync(CLE, OPTIONS);
      return null;
    }
    return data.user.id;
  } catch {
    return null;
  }
}
