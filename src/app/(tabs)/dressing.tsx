import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ajouterPiece, choisirPhoto, listerPieces, supprimerPiece, type Piece, type Source } from '@/lib/dressing';

const MINIMUM = 3;

export default function Dressing() {
  const theme = useTheme();
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    try {
      setPieces(await listerPieces());
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    let annule = false;
    listerPieces()
      .then((liste) => !annule && setPieces(liste))
      .catch((e: unknown) => !annule && setErreur(e instanceof Error ? e.message : String(e)))
      .finally(() => !annule && setChargement(false));
    return () => {
      annule = true;
    };
  }, []);

  const ajouter = async (source: Source) => {
    setErreur(null);
    try {
      const photo = await choisirPhoto(source);
      if (!photo) return;
      setEnvoi(true);
      await ajouterPiece(photo);
      await recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (piece: Piece) => {
    try {
      await supprimerPiece(piece);
      setPieces((liste) => liste.filter((p) => p.id !== piece.id));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  };

  const restantes = Math.max(0, MINIMUM - pieces.length);

  return (
    <ThemedView style={styles.fond}>
      <SafeAreaView style={styles.zone}>
        <ScrollView contentContainerStyle={styles.contenu}>
          <ThemedText type="subtitle">Ton dressing</ThemedText>
          <ThemedText themeColor="textSecondary">
            Pose un vêtement à plat, à la lumière du jour, et prends-le en photo.
          </ThemedText>
          {restantes > 0 && (
            <ThemedText type="smallBold">
              Encore {restantes} pièce{restantes > 1 ? 's' : ''} pour tes premières tenues.
            </ThemedText>
          )}

          <View style={styles.boutons}>
            <Bouton label="Prendre une photo" desactive={envoi} onPress={() => void ajouter('camera')} />
            <Bouton label="Choisir dans la galerie" desactive={envoi} onPress={() => void ajouter('galerie')} />
          </View>

          {envoi && (
            <View style={styles.ligne}>
              <ActivityIndicator />
              <ThemedText type="small">Envoi de la photo…</ThemedText>
            </View>
          )}
          {erreur && (
            <ThemedText type="small" style={styles.erreur}>
              {erreur}
            </ThemedText>
          )}

          {chargement ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.grille}>
              {pieces.map((piece) => (
                <View key={piece.id} style={[styles.carte, { backgroundColor: theme.backgroundElement }]}>
                  {piece.url ? (
                    <Image source={{ uri: piece.url }} style={styles.photo} contentFit="cover" />
                  ) : (
                    <View style={styles.photo} />
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Supprimer cette pièce"
                    onPress={() => void supprimer(piece)}
                    style={styles.supprimer}>
                    <ThemedText type="small" themeColor="textSecondary">
                      Supprimer
                    </ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  contenu: { padding: Spacing.four, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.four },
  boutons: { gap: Spacing.two },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  erreur: { color: '#D93025' },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  carte: { width: '48%', borderRadius: 14, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 3 / 4 },
  supprimer: { padding: Spacing.two, alignItems: 'center' },
});
