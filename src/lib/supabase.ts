import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const cle = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !cle) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY manquent (voir .env.example).');
}

// Pendant le rendu statique web (côté serveur), il n'y a pas de stockage : on n'enregistre pas la session.
const surServeur = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = createClient(url, cle, {
  auth: {
    storage: surServeur ? undefined : AsyncStorage,
    autoRefreshToken: !surServeur,
    persistSession: !surServeur,
    detectSessionInUrl: false,
  },
});

// Rafraîchit le jeton seulement quand l'app est au premier plan (recommandation Supabase pour React Native).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (etat) => {
    if (etat === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
