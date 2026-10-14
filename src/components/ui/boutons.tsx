import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Espace, Police, Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { label: string; detail?: string; selectionne?: boolean; onPress: () => void };

// Une réponse à choisir (questionnaire, filtres) : carte blanche, bord encre quand elle est choisie.
export function Choix({ label, detail, selectionne = false, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: selectionne }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choix,
        {
          backgroundColor: selectionne ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: selectionne ? theme.text : theme.border,
        },
        pressed && styles.enfonce,
      ]}>
      <View style={styles.texteChoix}>
        <ThemedText style={styles.labelChoix}>{label}</ThemedText>
        {detail && (
          <ThemedText type="small" themeColor="textSecondary">
            {detail}
          </ThemedText>
        )}
      </View>
      <View
        style={[
          styles.rond,
          { borderColor: selectionne ? theme.text : theme.border, backgroundColor: selectionne ? theme.text : 'transparent' },
        ]}
      />
    </Pressable>
  );
}

// Petite pastille de filtre (« Tous », « J'aime »).
export function Pastille({ label, selectionne = false, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: selectionne }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pastille,
        {
          backgroundColor: selectionne ? theme.text : theme.backgroundElement,
          borderColor: selectionne ? theme.text : theme.border,
        },
        pressed && styles.enfonce,
      ]}>
      <ThemedText type="smallBold" style={{ color: selectionne ? theme.surTexte : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export type VarianteBouton = 'principal' | 'secondaire' | 'discret' | 'danger';

type PropsBouton = {
  label: string;
  onPress: () => void;
  desactive?: boolean;
  chargement?: boolean;
  variante?: VarianteBouton;
};

// principal : pilule encre (l'action de l'écran). secondaire : pilule blanche bordée. discret : texte seul
// (Fermer, Plus tard). danger : pilule rouge (suppression définitive).
export function Bouton({ label, onPress, desactive = false, chargement = false, variante = 'principal' }: PropsBouton) {
  const theme = useTheme();
  const fond = {
    principal: theme.text,
    secondaire: theme.backgroundElement,
    discret: 'transparent',
    danger: theme.erreur,
  }[variante];
  const encre = { principal: theme.surTexte, secondaire: theme.text, discret: theme.textSecondary, danger: '#FFFFFF' }[
    variante
  ];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desactive || chargement, busy: chargement }}
      disabled={desactive || chargement}
      onPress={onPress}
      style={({ pressed }) => [
        styles.bouton,
        variante === 'discret' && styles.boutonDiscret,
        {
          backgroundColor: fond,
          borderColor: variante === 'secondaire' ? theme.border : 'transparent',
          opacity: desactive ? 0.35 : 1,
        },
        pressed && styles.enfonce,
      ]}>
      {chargement ? (
        <ActivityIndicator color={encre} />
      ) : (
        <ThemedText style={[styles.labelBouton, { color: encre }, variante === 'discret' && styles.labelDiscret]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.l,
    paddingVertical: Espace.l,
    paddingHorizontal: Espace.xl,
    borderRadius: Rayon.moyen,
    borderWidth: 1.5,
  },
  texteChoix: { flex: 1, gap: Espace.xxs },
  labelChoix: { fontFamily: Police.moyen },
  rond: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5 },
  pastille: { minHeight: 40, justifyContent: 'center', paddingHorizontal: Espace.l, borderRadius: Rayon.pilule, borderWidth: 1 },
  bouton: {
    minHeight: 56,
    paddingHorizontal: Espace.xxl,
    borderRadius: Rayon.pilule,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonDiscret: { minHeight: 44 },
  labelBouton: { fontFamily: Police.demiGras, fontSize: 16, textAlign: 'center' },
  labelDiscret: { fontFamily: Police.moyen, fontSize: 15 },
  enfonce: { opacity: 0.75, transform: [{ scale: 0.985 }] },
});
