import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// Notification « Ton essayage est prêt » (15 oct. 2026) : le serveur l'envoie quand Kie.ai a fini,
// même si l'app est fermée ou le téléphone verrouillé. Toucher la notification ouvre l'essai.

// App ouverte : on affiche quand même la bannière (l'utilisateur peut être sur un autre écran).
export function preparerNotifications() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// Notification touchée (app ouverte, en arrière-plan ou fermée) : ouvre l'essai. À appeler sous le navigateur.
export function useOuvrirDepuisNotification() {
  const reponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const essai = reponse?.notification.request.content.data?.essai;
    if (Platform.OS !== 'web' && typeof essai === 'string') router.push({ pathname: '/vetement', params: { essai } });
  }, [reponse]);
}

// Demandé au premier essayage (pas au lancement de l'app). Sans accord, l'essayage marche pareil :
// on retrouve le résultat dans l'onglet Essayages.
export async function activerNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data: jeton } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.rpc('enregistrer_appareil', { jeton });
  } catch {
    // Pas de réseau, Expo Go, simulateur : pas de notification, rien de cassé.
  }
}
