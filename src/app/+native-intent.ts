import { estLienDePartage } from '@/lib/partage';

// Un partage depuis une autre app ouvre l'app par un lien `appmode://expo-sharing…` (doc expo-sharing, SDK 57) :
// on l'envoie sur l'écran qui le reçoit. Les autres liens passent tels quels.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return estLienDePartage(path) ? '/partage' : path;
}
