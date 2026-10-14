import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Carte } from '@/components/ui';
import { Espace } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Les premières pièces à ajouter (3) : un point par pièce, rempli quand elle est là.
export function ObjectifPieces({ nombre, objectif }: { nombre: number; objectif: number }) {
  const theme = useTheme();
  const restantes = Math.max(0, objectif - nombre);
  if (!restantes) return null;
  return (
    <Carte accent style={styles.carte}>
      <View style={styles.points} accessibilityLabel={`${nombre} pièce${nombre > 1 ? 's' : ''} sur ${objectif}`}>
        {Array.from({ length: objectif }, (_, i) => (
          <View key={i} style={[styles.point, { backgroundColor: i < nombre ? theme.text : theme.backgroundElement }]} />
        ))}
      </View>
      <ThemedText type="smallBold" style={styles.texte}>
        Encore {restantes} pièce{restantes > 1 ? 's' : ''} pour tes premières tenues.
      </ThemedText>
    </Carte>
  );
}

const styles = StyleSheet.create({
  carte: { flexDirection: 'row', alignItems: 'center', gap: Espace.m, paddingVertical: Espace.l },
  points: { flexDirection: 'row', gap: Espace.xs },
  point: { width: 10, height: 10, borderRadius: 5 },
  texte: { flex: 1 },
});
