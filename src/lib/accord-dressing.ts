import AsyncStorage from '@react-native-async-storage/async-storage';

// Accord pour l'analyse des photos du dressing par une IA tierce (Anthropic, États-Unis).
// Apple, règle 5.1.2(i) : annoncer clairement l'envoi à une IA tierce et obtenir une permission explicite
// (lu le 16 oct. 2026). Demandé une seule fois, avant le premier ajout ; gardé sur l'appareil.
const CLE = 'akalie.accord_dressing';

export async function accordDressingDonne(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CLE)) === 'oui';
  } catch {
    return false;
  }
}

export async function donnerAccordDressing(): Promise<void> {
  await AsyncStorage.setItem(CLE, 'oui');
}
