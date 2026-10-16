import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ChargementIA } from '@/components/essayage/chargement-ia';
import { ThemedText } from '@/components/themed-text';
import { BarreProgression, Carte } from '@/components/ui';
import { Espace, Police } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ETAPES_GENERATION, etapeEnCours, progression, tempsRestant } from '@/lib/attente';

const ROTATION_MS = 7000;
const TIC_MS = 250;

// Pendant la génération (environ 2 minutes, revu le 15 oct. 2026 : « une animation de chargement qui captive,
// rien sur l'image ») : un grand pourcentage qui monte, les vraies étapes du serveur qui se cochent une à une,
// la barre, puis les conseils de la silhouette qui défilent. L'essayage continue même si on ferme l'app.
export function AttenteEssayage({ messages }: { etape: string; messages: string[] }) {
  // Heure d'arrivée sur l'écran d'attente, figée au premier rendu.
  const [debut] = useState(() => Date.now());
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    const minuteur = setInterval(() => setMaintenant(Date.now()), TIC_MS);
    return () => clearInterval(minuteur);
  }, []);

  const ecoule = maintenant - debut;
  const avance = progression(ecoule);
  const enCours = etapeEnCours(ecoule);
  const message = messages.length ? messages[Math.floor(ecoule / ROTATION_MS) % messages.length] : null;

  return (
    <Carte accent style={styles.carte}>
      <View style={styles.entete}>
        <ThemedText style={styles.pourcentage} accessibilityLabel={`${Math.round(avance * 100)} pour cent`}>
          {Math.round(avance * 100)}
          <ThemedText style={styles.signe}> %</ThemedText>
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {tempsRestant(ecoule)}
        </ThemedText>
      </View>
      <BarreProgression valeur={avance} epaisse />

      <View style={styles.etapes}>
        {ETAPES_GENERATION.map((e, i) => (
          <Etape
            key={e.libelle}
            libelle={e.libelle}
            etat={i < enCours ? 'fait' : i === enCours ? 'en_cours' : 'a_venir'}
          />
        ))}
      </View>

      {message && (
        <Animated.View key={message} entering={FadeIn.duration(400)} style={styles.conseil}>
          <ThemedText style={styles.texteConseil}>{message}</ThemedText>
        </Animated.View>
      )}
      <ThemedText type="small" themeColor="textSecondary">
        Tu peux fermer l’app : l’essayage continue et on te prévient quand c’est prêt. Il sera aussi dans l’onglet
        Essayages.
      </ThemedText>
    </Carte>
  );
}

function Etape({ libelle, etat }: { libelle: string; etat: 'fait' | 'en_cours' | 'a_venir' }) {
  const theme = useTheme();
  return (
    <Animated.View key={etat} entering={FadeIn.duration(300)} style={styles.etape}>
      <View style={styles.marque}>
        {etat === 'en_cours' ? (
          <ChargementIA />
        ) : etat === 'fait' ? (
          <View style={[styles.rond, { backgroundColor: theme.text }]}>
            <View style={[styles.coche, { borderColor: theme.surTexte }]} />
          </View>
        ) : (
          <View style={[styles.rond, styles.vide, { borderColor: theme.border }]} />
        )}
      </View>
      <ThemedText
        type={etat === 'en_cours' ? 'smallBold' : 'small'}
        themeColor={etat === 'a_venir' ? 'textSecondary' : 'text'}>
        {libelle}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  carte: { gap: Espace.l },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: Espace.m },
  pourcentage: {
    fontFamily: Police.tresGras,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  signe: { fontFamily: Police.gras, fontSize: 22, lineHeight: 52 },
  etapes: { gap: Espace.m },
  etape: { flexDirection: 'row', alignItems: 'center', gap: Espace.m },
  marque: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  rond: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  vide: { borderWidth: 2 },
  coche: {
    width: 5,
    height: 9,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
  conseil: { flexDirection: 'row', gap: Espace.m, alignItems: 'flex-start', minHeight: 48 },
  texteConseil: { flex: 1 },
});
