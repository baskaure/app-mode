import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Bouton, Carte, ListePuces, Mention } from '@/components/ui';
import { Espace, Police, Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Silhouette } from '@/lib/morphologie';

type Props = {
  silhouette: Silhouette;
  conseil: { nom: string; objectif: string; aPrivilegier: string[] };
  onContinuer: () => void;
};

// La fin du questionnaire : la silhouette en grand, ce qui lui va, et la suite (le dressing).
export function ResultatSilhouette({ silhouette, conseil, onContinuer }: Props) {
  const theme = useTheme();
  return (
    <>
      <Carte style={styles.carte}>
        <ThemedText type="eyebrow">Ta morphologie</ThemedText>
        <View style={[styles.lettre, { backgroundColor: theme.accentDoux }]}>
          <ThemedText style={styles.lettreTexte}>{silhouette}</ThemedText>
        </View>
        <ThemedText type="subtitle">{conseil.nom}</ThemedText>
        <ThemedText themeColor="textSecondary">{conseil.objectif}</ThemedText>
      </Carte>
      <View style={styles.liste}>
        <ThemedText type="titreCarte">Ce qui te va</ThemedText>
        <ListePuces elements={conseil.aPrivilegier.map((c) => c.charAt(0).toUpperCase() + c.slice(1))} />
      </View>
      <Bouton label="Ajouter mes 3 premières pièces" onPress={onContinuer} />
      <Mention>Prends 3 vêtements de ton placard en photo : je te compose tes premières tenues.</Mention>
    </>
  );
}

const styles = StyleSheet.create({
  carte: { alignItems: 'flex-start', gap: Espace.m, marginTop: Espace.s },
  lettre: { width: 72, height: 72, borderRadius: Rayon.moyen, alignItems: 'center', justifyContent: 'center' },
  lettreTexte: { fontFamily: Police.tresGras, fontSize: 40, lineHeight: 46 },
  liste: { gap: Espace.m },
});
