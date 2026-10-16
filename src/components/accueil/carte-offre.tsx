import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Surtitre } from '@/components/ui';
import { Espace, Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { gererAbonnement, lireFormule } from '@/lib/abonnement';
import { textePlan, type Plan } from '@/lib/plan';

// Encart encre : la formule active si le compte est abonné (15 oct. 2026), sinon l'offre complète (paywall).
export function CarteOffre() {
  const theme = useTheme();
  const [plan, setPlan] = useState<Plan | null>(null);

  // Relue à chaque retour sur l'accueil (par exemple juste après un achat).
  useFocusEffect(
    useCallback(() => {
      let annule = false;
      lireFormule()
        .then((p) => !annule && setPlan(p))
        .catch(() => !annule && setPlan(null));
      return () => {
        annule = true;
      };
    }, []),
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        plan
          ? `Ton abonnement : ${textePlan(plan)}. Gérer l’abonnement`
          : 'Voir l’offre complète : jusqu’à 30 essayages par mois'
      }
      onPress={() => (plan ? void gererAbonnement() : router.push('/paywall'))}
      style={({ pressed }) => [styles.offre, { backgroundColor: theme.text }, pressed && { opacity: 0.85 }]}>
      <Surtitre couleur={theme.accentInverse}>{plan ? 'Ton abonnement' : 'Offre complète'}</Surtitre>
      <ThemedText type="titreCarte" style={{ color: theme.surTexte }}>
        {plan ? textePlan(plan) : 'Jusqu’à 30 essayages par mois'}
      </ThemedText>
      <ThemedText type="small" style={{ color: theme.surTexte, opacity: 0.7 }}>
        {plan ? 'Jusqu’à 30 essayages par mois · Gérer →' : 'Voir l’offre →'}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({ offre: { borderRadius: Rayon.grand, padding: Espace.xxl, gap: Espace.s } });
