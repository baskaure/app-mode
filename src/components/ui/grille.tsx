import { Image } from 'expo-image';
import { Children, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Bouton } from '@/components/ui/boutons';
import { BadgeIA, Carte } from '@/components/ui/blocs';
import { Espace, Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Grille de 2 colonnes égales : les éléments vont par paires, le dernier seul garde la largeur d'une colonne.
export function Grille({ children }: { children: ReactNode }) {
  const elements = Children.toArray(children);
  const rangees: ReactNode[][] = [];
  for (let i = 0; i < elements.length; i += 2) rangees.push(elements.slice(i, i + 2));
  return (
    <View style={styles.grille}>
      {rangees.map((r, i) => (
        <View key={i} style={styles.rangee}>
          <View style={styles.colonne}>{r[0]}</View>
          <View style={styles.colonne}>{r[1]}</View>
        </View>
      ))}
    </View>
  );
}

type PropsVignette = {
  uri: string | null;
  label: string;
  onPress?: () => void;
  ia?: boolean;
  /** Éléments posés sur la photo (icônes, cœur). */
  surPhoto?: ReactNode;
  /** Action posée à droite de la légende (icône supprimer). */
  action?: ReactNode;
  children: ReactNode;
};

// Carte d'une grille : photo 3:4, légende dessous, une action à côté de la légende.
export function CarteVignette({ uri, label, onPress, ia = false, surPhoto, action, children }: PropsVignette) {
  const theme = useTheme();
  const photo = (
    <View style={[styles.photo, { backgroundColor: theme.backgroundSelected }]}>
      {uri && <Image source={{ uri }} style={styles.image} contentFit="cover" transition={150} />}
      {ia && <BadgeIA />}
      {surPhoto}
    </View>
  );
  return (
    <View style={[styles.carte, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {onPress ? (
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
          {photo}
        </Pressable>
      ) : (
        photo
      )}
      <View style={styles.bas}>
        <View style={styles.legende}>{children}</View>
        {action}
      </View>
    </View>
  );
}

// Écran ou section vide : ce qui apparaîtra ici, et comment commencer.
export function EtatVide({ titre, texte, action }: { titre: string; texte: string; action?: { label: string; onPress: () => void } }) {
  return (
    <Carte accent style={styles.vide}>
      <ThemedText type="titreCarte">{titre}</ThemedText>
      <ThemedText themeColor="textSecondary">{texte}</ThemedText>
      {action && <Bouton label={action.label} onPress={action.onPress} />}
    </Carte>
  );
}

const styles = StyleSheet.create({
  grille: { gap: Espace.m },
  rangee: { flexDirection: 'row', gap: Espace.m },
  colonne: { flex: 1 },
  carte: { borderRadius: Rayon.moyen, borderWidth: 1, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 3 / 4 },
  image: { width: '100%', height: '100%' },
  bas: { flexDirection: 'row', alignItems: 'center', gap: Espace.s, paddingLeft: Espace.m, paddingRight: Espace.s, paddingVertical: Espace.s, minHeight: 56 },
  legende: { flex: 1, gap: Espace.xxs },
  vide: { paddingVertical: Espace.xxl },
});
