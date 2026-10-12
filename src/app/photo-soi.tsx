import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { choisirPhoto, type Photo, type Source } from '@/lib/photos';
import { enregistrerSilhouette, verifierCadrage } from '@/lib/silhouette';

const CONSEILS = [
  'De la tête aux pieds, de face, bras légèrement écartés.',
  'Face à une fenêtre, à la lumière du jour.',
  'Devant un mur uni, sans personne d’autre sur la photo.',
  'Avec des vêtements près du corps : l’IA voit mieux ta silhouette.',
];

export default function PhotoSoi() {
  const theme = useTheme();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [consentement, setConsentement] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const prendre = async (source: Source) => {
    setErreur(null);
    try {
      const choisie = await choisirPhoto(source);
      if (!choisie) return;
      const probleme = verifierCadrage(choisie);
      if (probleme) {
        setErreur(probleme);
        return;
      }
      setPhoto(choisie);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  };

  const valider = async () => {
    if (!photo || !consentement) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await enregistrerSilhouette(photo);
      router.back();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <ThemedView style={styles.fond}>
      <SafeAreaView style={styles.zone}>
        <ScrollView contentContainerStyle={styles.contenu}>
          <ThemedText type="subtitle">Ta photo pour l’essayage</ThemedText>

          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.apercu} contentFit="contain" />
          ) : (
            <View style={styles.liste}>
              {CONSEILS.map((c) => (
                <ThemedText key={c}>• {c}</ThemedText>
              ))}
            </View>
          )}

          <View style={styles.boutons}>
            <Bouton
              label={photo ? 'Reprendre la photo' : 'Prendre la photo'}
              desactive={envoi}
              onPress={() => void prendre('camera')}
            />
            <Bouton label="Choisir dans la galerie" desactive={envoi} onPress={() => void prendre('galerie')} />
          </View>

          {photo && (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consentement }}
              onPress={() => setConsentement((c) => !c)}
              style={styles.consentement}>
              <View
                style={[
                  styles.case,
                  { borderColor: theme.text, backgroundColor: consentement ? theme.text : 'transparent' },
                ]}
              />
              <ThemedText type="small" style={styles.texteConsentement}>
                C’est bien moi sur la photo, et j’ai plus de 15 ans. Ma photo reste privée, sert uniquement à
                mes essayages, et je peux la supprimer quand je veux.
              </ThemedText>
            </Pressable>
          )}

          {photo && (
            <Bouton label="Utiliser cette photo" desactive={!consentement || envoi} onPress={() => void valider()} />
          )}

          {envoi && <ActivityIndicator />}
          {erreur && (
            <ThemedText type="small" style={styles.erreur}>
              {erreur}
            </ThemedText>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  contenu: { padding: Spacing.four, gap: Spacing.three },
  liste: { gap: Spacing.two },
  apercu: { width: '100%', aspectRatio: 3 / 4, borderRadius: 14 },
  boutons: { gap: Spacing.two },
  consentement: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  case: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, marginTop: 2 },
  texteConsentement: { flex: 1 },
  erreur: { color: '#D93025' },
});
