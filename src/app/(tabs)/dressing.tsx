import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

// Étape 3 du BRIEF : prise de photo, compression (~200 Ko), envoi à la fonction IA de reconnaissance.
export default function Dressing() {
  return (
    <ThemedView style={styles.fond}>
      <SafeAreaView style={styles.zone}>
        <ScrollView contentContainerStyle={styles.contenu}>
          <ThemedText type="subtitle">Ton dressing</ThemedText>
          <ThemedText themeColor="textSecondary">
            Pose un vêtement à plat, à la lumière du jour, et prends-le en photo.
          </ThemedText>
          <Bouton label="Prendre une pièce en photo" desactive onPress={() => {}} />
          <ThemedText type="small" themeColor="textSecondary">
            Bientôt : la reconnaissance des pièces par l’IA.
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  contenu: { padding: Spacing.four, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.four },
});
