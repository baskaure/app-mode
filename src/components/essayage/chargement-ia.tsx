import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

const TAILLE = 22;
const TOUR_MS = 900;

// Pendant la génération (15 oct. 2026, demande : « une animation de chargement, rien sur l'image ») :
// un anneau sobre qui tourne, couleur du texte. Si l'utilisateur a réduit les animations, il reste immobile.
export function ChargementIA() {
  const theme = useTheme();
  const calme = useReducedMotion();
  const angle = useSharedValue(0);

  useEffect(() => {
    if (calme) return;
    angle.value = withRepeat(withTiming(360, { duration: TOUR_MS, easing: Easing.linear }), -1);
  }, [calme, angle]);

  const rotation = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));

  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Génération en cours" style={styles.cadre}>
      <View style={[styles.anneau, { borderColor: theme.border }]} />
      <Animated.View
        style={[styles.anneau, styles.arc, { borderTopColor: theme.text, borderRightColor: theme.text }, rotation]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: { width: TAILLE, height: TAILLE },
  anneau: { position: 'absolute', width: TAILLE, height: TAILLE, borderRadius: TAILLE / 2, borderWidth: 2.5 },
  arc: { borderColor: 'transparent' },
});
