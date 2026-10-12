import { router } from 'expo-router';

// Ferme un écran ouvert en modal. Sans écran précédent (lien direct, rechargement, partage depuis
// une autre app), router.back() ne fait rien : on revient alors à l'accueil.
export function fermer() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
