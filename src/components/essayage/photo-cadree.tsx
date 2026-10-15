import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BadgeIA } from '@/components/ui';
import { Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  uri: string | null;
  /** Image produite par l'IA : badge « Créée par IA » obligatoire. */
  ia?: boolean;
  /** « contain » montre toute l'image (résultat), « cover » remplit le cadre (photo de soi). */
  remplir?: boolean;
  onPress?: () => void;
  label?: string;
  /** Éléments posés sur la photo (étiquette, icônes). */
  children?: ReactNode;
};

// Une photo en grand, format 3:4, coins arrondis : vêtement, photo de soi, résultat d'essayage.
export function PhotoCadree({ uri, ia = false, remplir = false, onPress, label, children }: Props) {
  const theme = useTheme();
  const contenu = (
    <>
      {uri && (
        <Image source={{ uri }} style={styles.image} contentFit={remplir ? 'cover' : 'contain'} transition={150} />
      )}
      {ia && <BadgeIA />}
      {children}
    </>
  );
  if (!onPress) return <View style={[styles.cadre, { backgroundColor: theme.backgroundElement }]}>{contenu}</View>;
  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cadre,
        { backgroundColor: theme.backgroundElement },
        pressed && { opacity: 0.9 },
      ]}>
      {contenu}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cadre: { width: '100%', aspectRatio: 3 / 4, borderRadius: Rayon.grand, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});
