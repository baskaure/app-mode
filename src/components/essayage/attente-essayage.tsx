import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BarreProgression, Carte, Etincelle } from '@/components/ui';
import { Espace } from '@/constants/theme';
import { progression, tempsRestant } from '@/lib/attente';

const ROTATION_MS = 7000;

// Pendant la génération (environ 2 minutes) : une barre qui suit le temps réel mesuré, le temps restant,
// et les conseils de la silhouette qui défilent. L'essayage continue même si on ferme l'écran.
export function AttenteEssayage({ etape, messages }: { etape: string; messages: string[] }) {
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
      <BarreProgression valeur={progression(ecoule)} epaisse />
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
  carte: { gap: Espace.l },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: Espace.m, flexWrap: 'wrap' },
  conseil: { flexDirection: 'row', gap: Espace.m, alignItems: 'flex-start', minHeight: 48 },
  etoile: { height: 24, justifyContent: 'center', paddingLeft: Espace.xxs },
  texteConseil: { flex: 1 },
});
