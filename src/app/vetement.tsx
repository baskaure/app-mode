import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listerPieces, type Piece } from '@/lib/dressing';
import {
  AbonnementRequis,
  essaiDepuisLien,
  essaiDepuisPhoto,
  essaiDepuisPiece,
  essayer,
  lireEssai,
  type Essai,
} from '@/lib/essais';
import { conseilPour } from '@/lib/morphologie';
import { useProfil } from '@/state/profil';
import { choisirPhoto, type Source } from '@/lib/photos';
import { fermer } from '@/lib/navigation';

// Choisir le vêtement à essayer : photo, lien d'article ou pièce du dressing.
// Un partage depuis une autre app (écran partage) arrive ici avec `?essai=<id>` déjà créé.
export default function Vetement() {
  const theme = useTheme();
  const { essai: essaiPartage } = useLocalSearchParams<{ essai?: string }>();
  const [lien, setLien] = useState('');
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [essai, setEssai] = useState<Essai | null>(null);
  const [etape, setEtape] = useState<string | null>(null);
  const [resultat, setResultat] = useState<string | null>(null);
  const { profil } = useProfil();
  const conseil = profil.silhouette ? conseilPour(profil.silhouette, profil.vestiaire ?? 'femme') : null;

  useEffect(() => {
    if (!essaiPartage) return;
    let annule = false;
    lireEssai(essaiPartage)
      .then((e) => !annule && setEssai(e))
      .catch((e: unknown) => !annule && setErreur(e instanceof Error ? e.message : String(e)));
    return () => {
      annule = true;
    };
  }, [essaiPartage]);

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

  const lancerEssayage = async (id: string) => {
    setErreur(null);
    setOccupe(true);
    try {
      setResultat(await essayer(id, setEtape));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
      // Essayage offert déjà utilisé : on montre l'offre ; au retour, le même bouton relance l'essai.
      if (e instanceof AbonnementRequis) router.push('/paywall');
    } finally {
      setEtape(null);
      setOccupe(false);
    }
  };

  if (resultat) {
    return (
      <Ecran>
        <ThemedText type="subtitle">Sur toi</ThemedText>
        <Image source={{ uri: resultat }} style={styles.apercu} contentFit="contain" />
        <ThemedText type="small" themeColor="textSecondary">
          Image créée par IA à partir de ta photo.
        </ThemedText>
        {conseil && (
          <ThemedText>
            {conseil.nom} : {conseil.objectif}
          </ThemedText>
        )}
        <Bouton
          label="Essayer un autre vêtement"
          onPress={() => {
            setResultat(null);
            setEssai(null);
          }}
        />
        <Bouton label="Fermer" onPress={() => fermer()} />
      </Ecran>
    );
  }

  if (essai) {
    return (
      <Ecran>
        <ThemedText type="subtitle">Vêtement prêt</ThemedText>
        {essai.url && <Image source={{ uri: essai.url }} style={styles.apercu} contentFit="contain" />}
        <Bouton label="M’essayer ce vêtement" desactive={occupe} onPress={() => void lancerEssayage(essai.id)} />
        {etape && (
          <View style={styles.ligne}>
            <ActivityIndicator />
            <ThemedText type="small">{etape}</ThemedText>
          </View>
        )}
        {erreur && (
          <ThemedText type="small" style={styles.erreur}>
            {erreur}
          </ThemedText>
        )}
        <Bouton label="Choisir un autre vêtement" desactive={occupe} onPress={() => setEssai(null)} />
        <Bouton label="Fermer" onPress={() => fermer()} />
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
  ligne: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
