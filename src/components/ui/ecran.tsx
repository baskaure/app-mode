import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Espace, Gouttiere, MaxContentWidth, Police } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { fermer as fermerEcran } from '@/lib/navigation';

const AURA = {
  light: require('@/assets/images/marque/aura-clair.png'),
  dark: require('@/assets/images/marque/aura-sombre.png'),
};
const SYMBOLE = {
  light: require('@/assets/images/marque/symbole.png'),
  dark: require('@/assets/images/marque/symbole-clair.png'),
};

function useSchema() {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

// Le fond de marque : crème (ou nuit) avec l'aura du logo en haut.
export function FondAura() {
  const { height } = useWindowDimensions();
  const theme = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]} pointerEvents="none">
      <Image source={AURA[useSchema()]} style={{ width: '100%', height: Math.max(height, 700) }} contentFit="cover" />
    </View>
  );
}

type PropsEcran = {
  children: ReactNode;
  eyebrow?: string;
  titre?: string;
  intro?: string;
  /** Affiche la croix de fermeture (écrans ouverts en modale). */
  fermable?: boolean;
  /** Écran d'onglet : laisse la place à la barre du bas. */
  onglet?: boolean;
  /** Contenu centré verticalement (attente, message seul) ; défile quand même si le texte est long. */
  centre?: boolean;
  enTete?: ReactNode;
};

// Gabarit de tous les écrans : fond aura, marges, largeur maximale, barre (logo, croix), titres, défilement.
export function Ecran({ children, eyebrow, titre, intro, fermable = false, onglet = false, centre = false, enTete }: PropsEcran) {
  const barre = (fermable || enTete) && (
    <View style={styles.barre}>
      <View style={styles.barreGauche}>{enTete}</View>
      {fermable && <BoutonFermer />}
    </View>
  );
  const titres = (eyebrow || titre || intro) && (
    <View style={styles.titres}>
      {eyebrow && <ThemedText type="eyebrow">{eyebrow}</ThemedText>}
      {titre && <ThemedText type="subtitle">{titre}</ThemedText>}
      {intro && (
        <ThemedText themeColor="textSecondary" style={styles.intro}>
          {intro}
        </ThemedText>
      )}
    </View>
  );
  return (
    <View style={styles.fond}>
      <FondAura />
      <SafeAreaView style={styles.zone} edges={onglet ? ['top', 'left', 'right'] : undefined}>
        {centre ? (
          <>
            {barre && <View style={styles.barreHaut}>{barre}</View>}
            <ScrollView contentContainerStyle={[styles.contenu, styles.centre]} showsVerticalScrollIndicator={false}>
              {titres}
              {children}
            </ScrollView>
          </>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.contenu, onglet && { paddingBottom: BottomTabInset + Espace.xxxl }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {barre}
            {titres}
            {children}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

export function BoutonFermer({ onPress = fermerEcran }: { onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Fermer"
      hitSlop={Espace.s}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fermer,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && { opacity: 0.6 },
      ]}>
      <View style={[styles.trait, { backgroundColor: theme.text, transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.trait, { backgroundColor: theme.text, transform: [{ rotate: '-45deg' }] }]} />
    </Pressable>
  );
}

// Le logo : symbole + mot « akalie ».
export function Logo({ taille = 28 }: { taille?: number }) {
  return (
    <View style={styles.logo} accessibilityRole="header" accessibilityLabel="Akalie">
      <Image source={SYMBOLE[useSchema()]} style={{ width: taille, height: taille }} />
      <ThemedText style={[styles.mot, { fontSize: taille * 0.82, lineHeight: taille }]}>akalie</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  contenu: { paddingHorizontal: Gouttiere, paddingTop: Espace.l, paddingBottom: Espace.xxxl, gap: Espace.xl },
  centre: { flexGrow: 1, justifyContent: 'center' },
  barre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  barreGauche: { flex: 1 },
  // Écran centré : la barre (logo, croix) reste en haut.
  barreHaut: { paddingHorizontal: Gouttiere, paddingTop: Espace.l },
  titres: { gap: Espace.s, marginTop: Espace.s, marginBottom: Espace.xs },
  intro: { fontSize: 17, lineHeight: 25 },
  // 44 × 44 : taille minimale de cible tactile recommandée par Apple.
  fermer: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  trait: { position: 'absolute', width: 15, height: 2, borderRadius: 1 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: Espace.s },
  mot: { fontFamily: Police.gras, letterSpacing: -1 },
});
