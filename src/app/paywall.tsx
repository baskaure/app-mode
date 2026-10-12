import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

// Étape 5 du BRIEF : branchement RevenueCat. Prix de départ à tester (hypothèse du BRIEF).
export default function Paywall() {
  return (
    <ThemedView style={styles.fond}>
      <SafeAreaView style={styles.zone}>
        <ThemedText type="subtitle">Habille-toi avec ce que tu as déjà</ThemedText>
        <View style={styles.liste}>
          <ThemedText>• Des tenues illimitées qui vont à ta morphologie</ThemedText>
          <ThemedText>• Ta tenue du jour selon la météo</ThemedText>
          <ThemedText>• Un dressing illimité</ThemedText>
        </View>
        <ThemedText type="smallBold">39,99 € par an · ou 9,99 € par mois</ThemedText>
        <Bouton label="Bientôt disponible" desactive onPress={() => {}} />
        <Bouton label="Plus tard" onPress={() => router.back()} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  liste: { gap: Spacing.one },
});
