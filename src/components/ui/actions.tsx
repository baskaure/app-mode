import { SymbolView } from 'expo-symbols';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Espace, Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Actions secondaires : de petites icônes, jamais un gros bouton de plus (règle du 15 oct. 2026).
export type NomIcone = Extract<ComponentProps<typeof SymbolView>['name'], object>;

// Icônes de l'app (SF Symbols sur iPhone, Material Symbols sur Android et le web).
export const ICONES = {
  partager: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
  telecharger: { ios: 'arrow.down.to.line', android: 'download', web: 'download' },
  aime: { ios: 'heart', android: 'favorite', web: 'favorite' },
  aimeActif: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  photo: { ios: 'camera', android: 'photo_camera', web: 'photo_camera' },
  galerie: { ios: 'photo.on.rectangle', android: 'photo_library', web: 'photo_library' },
  changer: { ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' },
  supprimer: { ios: 'trash', android: 'delete', web: 'delete' },
  valider: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
} as const satisfies Record<string, NomIcone>;

export function Icone({ nom, taille = 20, couleur }: { nom: NomIcone; taille?: number; couleur?: string }) {
  const theme = useTheme();
  return <SymbolView name={nom} size={taille} tintColor={couleur ?? theme.text} />;
}

type PropsAction = {
  nom: NomIcone;
  label: string;
  onPress: () => void;
  actif?: boolean;
  desactive?: boolean;
  chargement?: boolean;
  /** Sur une photo ou dans un champ : pastille plus petite, sans libellé visible. */
  surPhoto?: boolean;
  danger?: boolean;
};

export function ActionIcone({ nom, label, onPress, actif = false, desactive = false, chargement = false, surPhoto = false, danger = false }: PropsAction) {
  const theme = useTheme();
  const couleur = danger ? theme.erreur : actif ? theme.accent : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: actif, disabled: desactive || chargement, busy: chargement }}
      disabled={desactive || chargement}
      // La pastille fait 40 px : la zone tactile est élargie à 48 px.
      hitSlop={Espace.xs}
      onPress={onPress}
      style={({ pressed }) => [styles.action, (pressed || desactive) && { opacity: desactive ? 0.35 : 0.6 }]}>
      <View
        style={[
          surPhoto ? styles.pastilleIcone : styles.rondIcone,
          { backgroundColor: theme.backgroundElement, borderColor: danger ? theme.erreur : theme.border },
        ]}>
        {chargement ? <ActivityIndicator color={theme.text} /> : <Icone nom={nom} taille={surPhoto ? 18 : 22} couleur={couleur} />}
      </View>
      {!surPhoto && (
        <ThemedText type="small" style={[styles.labelAction, danger && { color: theme.erreur }]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

// Une rangée d'actions secondaires, centrée sous le contenu.
export function BarreActions({ children }: { children: ReactNode }) {
  return <View style={styles.barreActions}>{children}</View>;
}

// Une petite rangée d'icônes posée en haut à droite d'une photo.
export function ActionsSurPhoto({ children }: { children: ReactNode }) {
  return <View style={styles.surPhoto}>{children}</View>;
}

// Deux grandes tuiles côte à côte (appareil photo / galerie) au lieu de deux gros boutons empilés.
export function TuileAction({ nom, label, onPress, desactive = false }: { nom: NomIcone; label: string; onPress: () => void; desactive?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={desactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tuile,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        (pressed || desactive) && { opacity: desactive ? 0.35 : 0.7 },
      ]}>
      <Icone nom={nom} taille={26} />
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  );
}

export function RangeeTuiles({ children }: { children: ReactNode }) {
  return <View style={styles.rangeeTuiles}>{children}</View>;
}

// Lien discret (« Essayer un autre vêtement »), à la place d'un bouton secondaire.
export function LienDiscret({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <ThemedText type="link" themeColor="textSecondary" accessibilityRole="button" onPress={onPress} style={styles.lienDiscret}>
      {label}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  action: { alignItems: 'center', gap: Espace.s, minWidth: 64 },
  rondIcone: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pastilleIcone: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  labelAction: { fontSize: 12, lineHeight: 16 },
  barreActions: { flexDirection: 'row', justifyContent: 'center', gap: Espace.xxl, paddingVertical: Espace.xs },
  surPhoto: { position: 'absolute', top: Espace.m, right: Espace.m, flexDirection: 'row', gap: Espace.s },
  tuile: { flex: 1, borderRadius: Rayon.moyen, borderWidth: 1, paddingVertical: Espace.xl, alignItems: 'center', gap: Espace.s },
  rangeeTuiles: { flexDirection: 'row', gap: Espace.m },
  // Ligne de 44 px de haut au moins : assez grande pour le pouce.
  lienDiscret: { textAlign: 'center', paddingVertical: Espace.m },
});
