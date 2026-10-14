// Suivi des plantages (Sentry), branché le 15 oct. 2026. Rien n'est envoyé tant que EXPO_PUBLIC_SENTRY_DSN est vide.
// Vie privée : ni enregistrement d'écran (l'app montre des photos de corps), ni données personnelles, ni adresse IP.
// Seuls partent le message d'erreur, la pile d'appels, le modèle du téléphone et la version de l'app.
import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || undefined;

export function demarrerSuiviErreurs() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    // Pas de mesure de performance ni de profilage : seulement les erreurs.
    tracesSampleRate: 0,
    enableAutoSessionTracking: true,
    environment: __DEV__ ? 'developpement' : 'production',
  });
}

export const avecSuiviErreurs = Sentry.wrap;
