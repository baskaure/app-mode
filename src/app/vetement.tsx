import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listerPieces, type Piece } from '@/lib/dressing';
import { essaiDepuisLien, essaiDepuisPhoto, essaiDepuisPiece, lireEssai, type Essai } from '@/lib/essais';
import { choisirPhoto, type Source } from '@/lib/photos';

// Choisir le vêtement à essayer : photo, lien d'article ou pièce du dressing.
// Le partage direct depuis une autre app (Zara, Vinted…) viendra avec le build natif.
export default function Vetement() {
  const theme = useTheme();
  const [lien, setLien] = useState('');
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [essai, setEssai] = useState<Essai | null>(null);

  useEffect(() => {
    let annule = false;
    listerPieces()
      .then((liste) => !annule && setPieces(liste))
      .catch(() => {
        // le dressing est optionnel : sans pièces, la section ne s'affiche pas
      });
    return () => {
      annule = true;
    };
  }, []);

  const lancer = async (creer: () => Promise<string>) => {
    setOccupe(true);
    setErreur(null);
    try {
      setEssai(await lireEssai(await creer()));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe(false);
    }
  };

  const depuisPhoto = async (source: Source) => {
    setErreur(null);
    try {
      const photo = await choisirPhoto(source);
      if (photo) await lancer(() => essaiDepuisPhoto(photo));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  };

  if (essai) {
    return (
      <Ecran>
        <ThemedText type="subtitle">Vêtement prêt</ThemedText>
        {essai.url && <Image source={{ uri: essai.url }} style={styles.apercu} contentFit="contain" />}
        <Bouton label="M’essayer ce vêtement" desactive onPress={() => {}} />
        <ThemedText type="small" themeColor="textSecondary">
          Bientôt : l’IA t’habille avec ce vêtement sur ta photo.
        </ThemedText>
        <Bouton label="Choisir un autre vêtement" onPress={() => setEssai(null)} />
        <Bouton label="Fermer" onPress={() => router.back()} />
      </Ecran>
    );
  }

  return (
    <Ecran>
      <ThemedText type="subtitle">Quel vêtement essayer ?</ThemedText>

      <ThemedText type="smallBold">Une photo du vêtement</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Une capture d’écran de l’article, ou une photo prise en magasin.
      </ThemedText>
      <View style={styles.boutons}>
        <Bouton label="Prendre une photo" desactive={occupe} onPress={() => void depuisPhoto('camera')} />
        <Bouton label="Choisir dans la galerie" desactive={occupe} onPress={() => void depuisPhoto('galerie')} />
      </View>

      <ThemedText type="smallBold">Le lien de l’article</ThemedText>
      <TextInput
        value={lien}
        onChangeText={setLien}
        placeholder="https://www.zara.com/fr/…"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        inputMode="url"
        style={[styles.champ, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />
      <Bouton
        label="Utiliser ce lien"
        desactive={occupe || !/^https?:\/\/\S+\.\S+/.test(lien.trim())}
        onPress={() => void lancer(() => essaiDepuisLien(lien))}
      />

      {pieces.length > 0 && (
        <>
          <ThemedText type="smallBold">Une pièce de ton dressing</ThemedText>
          <ScrollView horizontal contentContainerStyle={styles.rangee} showsHorizontalScrollIndicator={false}>
            {pieces.map((piece) => (
              <Pressable
                key={piece.id}
                accessibilityRole="button"
                accessibilityLabel="Essayer cette pièce"
                disabled={occupe}
                onPress={() => void lancer(() => essaiDepuisPiece(piece))}>
                {piece.url && <Image source={{ uri: piece.url }} style={styles.vignette} contentFit="cover" />}
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {occupe && <ActivityIndicator />}
      {erreur && (
        <ThemedText type="small" style={styles.erreur}>
          {erreur}
        </ThemedText>
      )}
    </Ecran>
  );
}

function Ecran({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView style={styles.fond}>
      <SafeAreaView style={styles.zone}>
        <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  contenu: { padding: Spacing.four, gap: Spacing.three },
  boutons: { gap: Spacing.two },
  champ: { borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  rangee: { gap: Spacing.two },
  vignette: { width: 96, height: 128, borderRadius: 10 },
  apercu: { width: '100%', aspectRatio: 3 / 4, borderRadius: 14 },
  erreur: { color: '#D93025' },
});
