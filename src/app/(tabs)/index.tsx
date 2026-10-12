import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { CONSEILS } from '@/lib/morphologie';
import { useProfil } from '@/state/profil';

// Étape 4 du BRIEF : 3 tenues à plat avec « pourquoi ça te va », puis le mur de paiement.
export default function Tenues() {
  const { profil } = useProfil();
  const conseil = profil.silhouette ? CONSEILS[profil.silhouette] : null;

  return (
    <ThemedView style={styles.fond}>
      <SafeAreaView style={styles.zone}>
        <ScrollView contentContainerStyle={styles.contenu}>
          <ThemedText type="subtitle">Tes tenues</ThemedText>
          {conseil && <ThemedText themeColor="textSecondary">{conseil.nom} · {conseil.objectif}</ThemedText>}
          <ThemedText>Ajoute 3 pièces dans ton dressing pour voir tes premières tenues.</ThemedText>
          <Bouton label="Voir l’offre complète" onPress={() => router.push('/paywall')} />
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
