import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Etincelle } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

const PASSAGE_MS = 2600;
// Bande lumineuse : des lignes dont l'opacité monte puis redescend (un dégradé, sans dépendance native).
const LIGNES = [0.06, 0.12, 0.2, 0.3, 0.42, 0.3, 0.2, 0.12, 0.06];

// Pendant la génération (15 oct. 2026) : une bande rose balaie la photo du vêtement de haut en bas,
// et trois étincelles clignotent. Si l'utilisateur a réduit les animations, tout reste immobile.
export function ScanIA() {
  const theme = useTheme();
  const calme = useReducedMotion();
  const position = useSharedValue(calme ? 45 : -20);

  useEffect(() => {
    if (calme) return;
    position.value = withRepeat(
      withSequence(
        withTiming(105, { duration: PASSAGE_MS, easing: Easing.inOut(Easing.cubic) }),
        withTiming(-20, { duration: 0 }),
      ),
      -1,
    );
  }, [calme, position]);

  const bande = useAnimatedStyle(() => ({ top: `${position.value}%` }));

  return (
    <View
      style={styles.voile}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.bande, bande]}>
        {LIGNES.map((opacite, i) => (
          <View key={i} style={[styles.ligne, { backgroundColor: theme.accent, opacity: opacite }]} />
        ))}
      </Animated.View>
      <Scintille gauche="18%" haut="22%" retard={0} calme={calme} />
      <Scintille gauche="74%" haut="40%" retard={700} calme={calme} />
      <Scintille gauche="30%" haut="70%" retard={1400} calme={calme} />
    </View>
  );
}

function Scintille({
  gauche,
  haut,
  retard,
  calme,
}: {
  gauche: `${number}%`;
  haut: `${number}%`;
  retard: number;
  calme: boolean;
}) {
  const eclat = useSharedValue(calme ? 1 : 0);

  useEffect(() => {
    if (calme) return;
    eclat.value = withDelay(
      retard,
      withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(0, { duration: 1500 })), -1),
    );
  }, [calme, eclat, retard]);

  const style = useAnimatedStyle(() => ({ opacity: eclat.value, transform: [{ scale: 0.6 + eclat.value * 0.6 }] }));

  return (
    <Animated.View style={[styles.scintille, { left: gauche, top: haut }, style]}>
      <Etincelle taille={14} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  voile: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(11, 11, 15, 0.06)' },
  bande: { position: 'absolute', left: 0, right: 0, height: '18%' },
  ligne: { flex: 1 },
  scintille: { position: 'absolute' },
});
