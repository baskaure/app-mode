import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/hooks/use-theme';

const DURATION = 650;

// Reprend l'écran de lancement natif (icône Akalie sur crème ou nuit) puis le fait disparaître en douceur.
export function AnimatedSplashOverlay() {
  const theme = useTheme();
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const sortie = new Keyframe({
    0: { opacity: 1, transform: [{ scale: 1 }] },
    35: { opacity: 1, transform: [{ scale: 1.04 }], easing: Easing.out(Easing.quad) },
    100: { opacity: 0, transform: [{ scale: 1.12 }], easing: Easing.in(Easing.quad) },
  });

  const fond = [styles.overlay, { backgroundColor: theme.background }];
  const icone = <Image style={styles.icone} source={require('@/assets/images/splash-icon.png')} />;

  return animate ? (
    <Animated.View
      entering={sortie.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) scheduleOnRN(setVisible, false);
      })}
      style={fond}>
      {icone}
    </Animated.View>
  ) : (
    <View onLayout={() => void SplashScreen.hideAsync().finally(() => setAnimate(true))} style={fond}>
      {icone}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  // Même taille que l'écran natif (imageWidth 200 dans app.json).
  icone: { width: 200, height: 200 },
});
