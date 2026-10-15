import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ActionIcone, Carte, ICONES, RangeeTuiles, Section, TuileAction } from '@/components/ui';
import { Espace, Police, Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Piece } from '@/lib/dressing';
import type { Source } from '@/lib/photos';

const LIEN_VALIDE = /^https?:\/\/\S+\.\S+/;

type Props = {
  pieces: Piece[];
  occupe: boolean;
  onPhoto: (source: Source) => void;
  onLien: (lien: string) => void;
  onPiece: (piece: Piece) => void;
};

// Les trois façons de donner le vêtement à essayer : une photo, le lien de l'article, une pièce du dressing.
export function ChoixVetement({ pieces, occupe, onPhoto, onLien, onPiece }: Props) {
  const theme = useTheme();
  const [lien, setLien] = useState('');
  const valide = LIEN_VALIDE.test(lien.trim());
  const envoyer = () => valide && !occupe && onLien(lien);

  return (
    <>
      <Carte>
        <Section
          titre="Une photo du vêtement"
          detail="Une capture d’écran de l’article, ou une photo prise en magasin.">
          <RangeeTuiles>
            <TuileAction nom={ICONES.photo} label="Photo" desactive={occupe} onPress={() => onPhoto('camera')} />
            <TuileAction nom={ICONES.galerie} label="Galerie" desactive={occupe} onPress={() => onPhoto('galerie')} />
          </RangeeTuiles>
        </Section>
      </Carte>

      <Carte>
        <Section titre="Le lien de l’article">
          <View style={[styles.champLigne, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <TextInput
              value={lien}
              onChangeText={setLien}
              placeholder="https://www.zara.com/fr/…"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              inputMode="url"
              returnKeyType="go"
              onSubmitEditing={envoyer}
              accessibilityLabel="Lien de l’article"
              style={[styles.champ, { color: theme.text }]}
            />
            <ActionIcone
              nom={ICONES.valider}
              label="Utiliser ce lien"
              surPhoto
              desactive={occupe || !valide}
              onPress={envoyer}
            />
          </View>
        </Section>
      </Carte>

      {pieces.length > 0 && (
        <Section titre="Une pièce de ton dressing">
          <ScrollView horizontal contentContainerStyle={styles.rangee} showsHorizontalScrollIndicator={false}>
            {pieces.map((piece) => (
              <Pressable
                key={piece.id}
                accessibilityRole="button"
                accessibilityLabel={piece.description ? `Essayer ${piece.description}` : 'Essayer cette pièce'}
                disabled={occupe}
                onPress={() => onPiece(piece)}
                style={({ pressed }) => [styles.vignette, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}>
                {piece.url && <Image source={{ uri: piece.url }} style={styles.image} contentFit="cover" />}
              </Pressable>
            ))}
          </ScrollView>
        </Section>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  champLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Rayon.moyen,
    borderWidth: 1,
    paddingRight: Espace.xs,
  },
  champ: { flex: 1, minHeight: 52, paddingHorizontal: Espace.l, fontSize: 16, fontFamily: Police.normal },
  rangee: { gap: Espace.m, paddingRight: Espace.xl },
  vignette: { width: 104, height: 138, borderRadius: Rayon.petit, borderWidth: 1, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});
