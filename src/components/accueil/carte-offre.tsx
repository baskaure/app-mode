import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SurtitreEtincelle } from '@/components/ui';
import { Espace, Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Encart encre qui mène à l'offre complète (paywall).
export function CarteOffre() {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voir l’offre complète : jusqu’à 30 essayages par mois"
      onPress={() => router.push('/paywall')}
      style={({ pressed }) => [styles.offre, { backgroundColor: theme.text }, pressed && { opacity: 0.85 }]}>
      <SurtitreEtincelle couleur={theme.accentInverse}>Offre complète</SurtitreEtincelle>
      <ThemedText type="titreCarte" style={{ color: theme.surTexte }}>
        Jusqu’à 30 essayages par mois
      </ThemedText>
      <ThemedText type="small" style={{ color: theme.surTexte, opacity: 0.7 }}>
        Voir l’offre →
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  offre: { borderRadius: Rayon.grand, padding: Espace.xxl, gap: Espace.s },
});
