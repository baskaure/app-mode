import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Espace, Police, Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  titre: string;
  prix: string;
  /** « soit 5,00 € par mois » (formule annuelle). */
  detail: string | null;
  badge?: string;
  selectionnee: boolean;
  onPress: () => void;
};

// Une formule d'abonnement à choisir (bouton radio).
export function LigneFormule({ titre, prix, detail, badge, selectionnee, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      role="radio"
      aria-checked={selectionnee}
      aria-label={`${titre}, ${prix}`}
      onPress={onPress}
      style={[styles.formule, { backgroundColor: theme.backgroundElement, borderColor: selectionnee ? theme.text : theme.border }]}>
      <View style={[styles.radio, { borderColor: selectionnee ? theme.text : theme.border }]}>
        {selectionnee && <View style={[styles.radioPlein, { backgroundColor: theme.text }]} />}
      </View>
      <View style={styles.texte}>
        <View style={styles.entete}>
          <ThemedText type="titreCarte">{titre}</ThemedText>
          {badge && (
            <View style={[styles.badge, { backgroundColor: theme.accentTexte }]}>
              <ThemedText style={[styles.badgeTexte, { color: theme.surTexte }]}>{badge}</ThemedText>
            </View>
          )}
        </View>
        <ThemedText>{prix}</ThemedText>
        {detail && (
          <ThemedText type="small" themeColor="textSecondary">
            {detail}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  formule: { flexDirection: 'row', gap: Espace.m, alignItems: 'flex-start', borderRadius: Rayon.grand, borderWidth: 2, padding: Espace.l },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, marginTop: Espace.xxs, alignItems: 'center', justifyContent: 'center' },
  radioPlein: { width: 10, height: 10, borderRadius: 5 },
  texte: { flex: 1, gap: Espace.xxs },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Espace.s },
  badge: { paddingHorizontal: Espace.m, paddingVertical: Espace.xxs, borderRadius: Rayon.pilule },
  badgeTexte: { fontFamily: Police.demiGras, fontSize: 11, lineHeight: 15 },
});
