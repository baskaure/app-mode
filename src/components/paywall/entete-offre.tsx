import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ListePuces, SurtitreEtincelle } from '@/components/ui';
import { Aura, Espace } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const AVANTAGES = [
  'Jusqu’à 30 essayages par mois sur ta propre photo',
  'Pourquoi chaque vêtement va, ou pas, à ta morphologie',
  'Ton dressing pour associer tes nouvelles pièces',
];

// Le haut du paywall : les trois couleurs de l'aura, la promesse, ce que contient l'offre.
export function EnteteOffre() {
  const theme = useTheme();
  return (
    <>
      <View style={styles.tete}>
        <View style={styles.pastilles}>
          {[Aura.rose, Aura.peche, Aura.lilas].map((c) => (
            <View key={c} style={[styles.pastille, { backgroundColor: c, borderColor: theme.background }]} />
          ))}
        </View>
        <SurtitreEtincelle>Offre complète</SurtitreEtincelle>
        <ThemedText type="title">Essaie-le sur toi avant de l’acheter</ThemedText>
      </View>
      <ListePuces elements={AVANTAGES} />
    </>
  );
}

const styles = StyleSheet.create({
  tete: { gap: Espace.m },
  pastilles: { flexDirection: 'row', marginBottom: Espace.xs },
  pastille: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, marginRight: -Espace.m },
});
