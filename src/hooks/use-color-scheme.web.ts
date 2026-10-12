import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// Rendu statique : le serveur ne connaît pas le thème. useSyncExternalStore renvoie false au rendu serveur
// et à l'hydratation, puis true côté client, sans setState dans un effet (règle react-hooks/set-state-in-effect).
const sAbonner = () => () => {};

export function useColorScheme() {
  const hydrate = useSyncExternalStore(
    sAbonner,
    () => true,
    () => false,
  );
  const colorScheme = useRNColorScheme();
  return hydrate ? colorScheme : 'light';
}
