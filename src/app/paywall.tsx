import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { fermer } from '@/lib/navigation';

// Étape 6 du BRIEF : branchement RevenueCat. Prix validé le 12 oct. 2026 ; plafond d'essayages = ESSAIS_MAX_PAR_MOIS côté serveur.
export default function Paywall() {
  return (
    <ThemedView style={styles.fond}>
      <SafeAreaView style={styles.zone}>
        <ThemedText type="subtitle">Essaie-le sur toi avant de l’acheter</ThemedText>
        <View style={styles.liste}>
          <ThemedText>• Jusqu’à 30 essayages par mois sur ta propre photo</ThemedText>
          <ThemedText>• Pourquoi chaque vêtement va, ou pas, à ta morphologie</ThemedText>
          <ThemedText>• Ton dressing pour associer tes nouvelles pièces</ThemedText>
        </View>
        <ThemedText type="smallBold">39,99 € par an · ou 9,99 € par mois</ThemedText>
        <Bouton label="Bientôt disponible" desactive onPress={() => {}} />
        <Bouton label="Plus tard" onPress={() => fermer()} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  liste: { gap: Spacing.one },
});
