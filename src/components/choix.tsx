import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { label: string; selectionne?: boolean; onPress: () => void };

export function Choix({ label, selectionne = false, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: selectionne }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choix,
        { backgroundColor: selectionne ? theme.backgroundSelected : theme.backgroundElement },
        pressed && styles.presse,
      ]}>
      <ThemedText>{label}</ThemedText>
    </Pressable>
  );
}

export function Bouton({ label, onPress, desactive = false }: { label: string; onPress: () => void; desactive?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={desactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.bouton,
        { backgroundColor: theme.text, opacity: desactive ? 0.4 : 1 },
        pressed && styles.presse,
      ]}>
      <ThemedText style={{ color: theme.background, textAlign: 'center' }} type="smallBold">
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choix: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.four, borderRadius: 14 },
  bouton: { paddingVertical: Spacing.three, borderRadius: 999 },
  presse: { opacity: 0.7 },
});
