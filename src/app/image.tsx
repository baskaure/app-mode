import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fermer } from '@/lib/navigation';
import { AccesRefuse, enregistrerImage } from '@/lib/telecharger';

const ZOOM_MAX = 4;
const ZOOM_DOUBLE_TAP = 2.5;

// Image d'essayage en plein écran : pincer pour zoomer, glisser pour se déplacer, double-toucher pour zoomer ou revenir.
// Ouverte depuis le résultat avec `?url=<lien signé>&nom=<fichier>`.
export default function VueImage() {
  const { url, nom } = useLocalSearchParams<{ url?: string; nom?: string }>();
  const [message, setMessage] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  const echelle = useSharedValue(1);
  const echelleDepart = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const xDepart = useSharedValue(0);
  const yDepart = useSharedValue(0);

  const recentrer = () => {
    'worklet';
    echelle.value = withTiming(1);
    x.value = withTiming(0);
    y.value = withTiming(0);
  };

  const pincer = Gesture.Pinch()
    .onStart(() => {
      echelleDepart.value = echelle.value;
    })
    .onUpdate((e) => {
      echelle.value = Math.min(ZOOM_MAX, Math.max(1, echelleDepart.value * e.scale));
    })
    .onEnd(() => {
      if (echelle.value <= 1.05) recentrer();
    });

  const glisser = Gesture.Pan()
    .averageTouches(true)
    .onStart(() => {
      xDepart.value = x.value;
      yDepart.value = y.value;
    })
    .onUpdate((e) => {
      if (echelle.value <= 1) return;
      x.value = xDepart.value + e.translationX;
      y.value = yDepart.value + e.translationY;
    });

  const doubleTouche = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (echelle.value > 1) recentrer();
      else echelle.value = withTiming(ZOOM_DOUBLE_TAP);
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: echelle.value }],
  }));

  const telecharger = async () => {
    if (!url) return;
    setOccupe(true);
    setMessage(null);
    try {
      await enregistrerImage(url, nom || `essayage-${Date.now()}.png`);
      setMessage('Image enregistrée dans ta galerie.');
    } catch (e) {
      setMessage(e instanceof AccesRefuse || e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setOccupe(false);
    }
  };

  return (
    <ThemedView style={styles.fond}>
      <SafeAreaView style={styles.zone}>
        <GestureDetector gesture={Gesture.Simultaneous(pincer, glisser, doubleTouche)}>
          <View style={styles.cadre} collapsable={false}>
            {url && (
              <Animated.View style={[styles.cadre, style]}>
                <Image source={{ uri: url }} style={styles.image} contentFit="contain" accessibilityLabel="Image créée par IA" />
              </Animated.View>
            )}
          </View>
        </GestureDetector>
        <View style={styles.bas}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.texte}>
            Image créée par IA · pince pour zoomer, touche deux fois pour revenir
          </ThemedText>
          {message && (
            <ThemedText type="small" style={styles.texte}>
              {message}
            </ThemedText>
          )}
          <Bouton label="Télécharger l’image" desactive={occupe || !url} onPress={() => void telecharger()} />
          <Bouton label="Fermer" onPress={() => fermer()} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: { flex: 1 },
  cadre: { flex: 1, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  bas: { padding: Spacing.four, gap: Spacing.two },
  texte: { textAlign: 'center' },
});
