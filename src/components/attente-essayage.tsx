import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Carte, Etincelle } from '@/components/ui';
import { Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { progression, tempsRestant } from '@/lib/attente';

const ROTATION_MS = 7000;

// Pendant la génération (environ 2 minutes) : une barre qui suit le temps réel mesuré, le temps restant,
// et les conseils de la silhouette qui défilent. L'essayage continue même si on ferme l'écran.
export function AttenteEssayage({ etape, messages }: { etape: string; messages: string[] }) {
  const theme = useTheme();
  // Heure d'arrivée sur l'écran d'attente, figée au premier rendu.
  const [debut] = useState(() => Date.now());
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    const minuteur = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(minuteur);
  }, []);

  const ecoule = maintenant - debut;
  const message = messages.length ? messages[Math.floor(ecoule / ROTATION_MS) % messages.length] : null;

  return (
    <Carte accent style={styles.carte}>
      <View style={styles.ligne}>
        <ThemedText type="smallBold">{etape}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {tempsRestant(ecoule)}
        </ThemedText>
      </View>
      <View
        style={[styles.rail, { backgroundColor: theme.backgroundElement }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progression(ecoule) * 100) }}>
        <View style={[styles.avance, { width: `${progression(ecoule) * 100}%`, backgroundColor: theme.text }]} />
      </View>
      {message && (
        <View style={styles.conseil}>
          <View style={styles.etoile}>
            <Etincelle taille={7} />
          </View>
          <ThemedText style={styles.texteConseil}>{message}</ThemedText>
        </View>
      )}
      <ThemedText type="small" themeColor="textSecondary">
        Tu peux fermer cet écran : l’essayage continue. Tu le retrouveras dans l’onglet Essayages.
      </ThemedText>
    </Carte>
  );
}

const styles = StyleSheet.create({
  carte: { gap: 14 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' },
  rail: { height: 6, borderRadius: Rayon.pilule, overflow: 'hidden' },
  avance: { height: 6, borderRadius: Rayon.pilule },
  conseil: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', minHeight: 48 },
  etoile: { height: 24, justifyContent: 'center', paddingLeft: 2 },
  texteConseil: { flex: 1 },
});
