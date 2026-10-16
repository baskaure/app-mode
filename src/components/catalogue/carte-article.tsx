import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Espace, Police, Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { nomAffiche, prixAffiche, type Recommandation } from '@/lib/catalogue-regles';
import type { Piece } from '@/lib/dressing';

type Props = {
  reco: Recommandation;
  /** Pièce du dressing avec laquelle l'article va (petite vignette en coin). */
  piece?: Piece | null;
  largeur?: number | `${number}%`;
  raison?: boolean;
};

// Un article du catalogue : vraie photo, marque, nom, prix. Toucher ouvre la fiche (essayer ou acheter).
export function CarteArticle({ reco, piece, largeur, raison = true }: Props) {
  const theme = useTheme();
  const { article } = reco;
  const prix = prixAffiche(article);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${article.marque ?? article.marchand}, ${nomAffiche(article)}${prix ? `, ${prix}` : ''}`}
      onPress={() => router.push({ pathname: '/article', params: { id: article.id, raison: reco.raison, piece: reco.pieceId ?? '' } })}
      style={({ pressed }) => [
        styles.carte,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        largeur !== undefined && { width: largeur },
        pressed && { opacity: 0.85 },
      ]}>
      <View style={styles.cadre}>
        <Image source={{ uri: article.image_url }} style={styles.photo} contentFit="cover" transition={150} />
        {piece?.url && (
          <View style={[styles.vignette, { borderColor: theme.backgroundElement }]}>
            <Image source={{ uri: piece.url }} style={styles.vignetteImage} contentFit="cover" />
          </View>
        )}
      </View>
      <View style={styles.texte}>
        <ThemedText type="eyebrow" numberOfLines={1}>
          {article.marque ?? article.marchand}
        </ThemedText>
        <ThemedText type="small" numberOfLines={2} style={styles.nom}>
          {nomAffiche(article)}
        </ThemedText>
        {prix && <ThemedText type="smallBold">{prix}</ThemedText>}
        {raison && !!reco.raison && (
          <ThemedText type="small" numberOfLines={2} style={[styles.raison, { color: theme.accentTexte }]}>
            {reco.raison}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: { borderRadius: Rayon.moyen, borderWidth: 1, overflow: 'hidden' },
  cadre: { backgroundColor: '#F4F1EE' },
  photo: { width: '100%', aspectRatio: 3 / 4 },
  vignette: {
    position: 'absolute',
    left: Espace.s,
    bottom: Espace.s,
    width: 40,
    height: 52,
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
  },
  vignetteImage: { width: '100%', height: '100%' },
  texte: { padding: Espace.m, gap: Espace.xxs },
  nom: { minHeight: 40 },
  raison: { fontFamily: Police.moyen, fontSize: 12, lineHeight: 16, marginTop: Espace.xxs },
});
