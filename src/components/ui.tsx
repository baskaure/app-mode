import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Police, Rayon, Spacing } from '@/constants/theme';
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
  /** Contenu centré verticalement, sans défilement (attente, message seul). */
  centre?: boolean;
  enTete?: ReactNode;
};

export function Ecran({ children, eyebrow, titre, intro, fermable = false, onglet = false, centre = false, enTete }: PropsEcran) {
  const barre = (fermable || enTete) && (
    <View style={styles.barre}>
      <View style={styles.barreGauche}>{enTete}</View>
      {fermable && <BoutonFermer />}
    </View>
  );
  const tete = (
    <>
      {(eyebrow || titre || intro) && (
        <View style={styles.titres}>
          {eyebrow && <ThemedText type="eyebrow">{eyebrow}</ThemedText>}
          {titre && <ThemedText type="subtitle">{titre}</ThemedText>}
          {intro && (
            <ThemedText themeColor="textSecondary" style={styles.intro}>
              {intro}
            </ThemedText>
          )}
        </View>
      )}
    </>
  );
  return (
    <View style={styles.fond}>
      <FondAura />
      <SafeAreaView style={styles.zone} edges={onglet ? ['top', 'left', 'right'] : undefined}>
        {centre ? (
          <>
            {barre && <View style={styles.barreHaut}>{barre}</View>}
            {/* Défile quand même si le message est long (petit écran). */}
            <ScrollView contentContainerStyle={[styles.contenu, styles.centre]} showsVerticalScrollIndicator={false}>
              {tete}
              {children}
            </ScrollView>
          </>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.contenu, onglet && { paddingBottom: BottomTabInset + Spacing.five }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {barre}
            {tete}
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
      hitSlop={8}
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

export function Carte({ children, style, accent = false }: { children: ReactNode; style?: ViewStyle; accent?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.carte,
        {
          backgroundColor: accent ? theme.accentDoux : theme.backgroundElement,
          borderColor: accent ? 'transparent' : theme.border,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

// L'étincelle de la marque, dessinée (la police Onest n'a pas le caractère ✦).
export function Etincelle({ taille = 8, couleur }: { taille?: number; couleur?: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: taille,
        height: taille,
        borderRadius: taille * 0.18,
        backgroundColor: couleur ?? theme.accent,
        transform: [{ rotate: '45deg' }],
      }}
    />
  );
}

// Un surtitre précédé de l'étincelle.
export function SurtitreEtincelle({ children, couleur }: { children: ReactNode; couleur?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.surtitre}>
      <Etincelle taille={7} couleur={couleur} />
      <ThemedText type="eyebrow" style={{ color: couleur ?? theme.accentTexte }}>
        {children}
      </ThemedText>
    </View>
  );
}

// Une ligne de liste avec l'étincelle de la marque.
export function Puce({ children }: { children: ReactNode }) {
  return (
    <View style={styles.puce}>
      <View style={styles.etoile}>
        <Etincelle taille={7} />
      </View>
      <ThemedText style={styles.textePuce}>{children}</ThemedText>
    </View>
  );
}

export function Section({ titre, detail, children }: { titre: string; detail?: string; children?: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.titreSection}>
        <ThemedText type="titreCarte">{titre}</ThemedText>
        {detail && (
          <ThemedText type="small" themeColor="textSecondary">
            {detail}
          </ThemedText>
        )}
      </View>
      {children}
    </View>
  );
}

export function MessageErreur({ children }: { children: ReactNode }) {
  const theme = useTheme();
  if (!children) return null;
  return (
    <View style={[styles.message, { backgroundColor: theme.erreurFond }]} accessibilityRole="alert">
      <ThemedText type="small" style={{ color: theme.erreur }}>
        {children}
      </ThemedText>
    </View>
  );
}

export function MessageInfo({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.message, { backgroundColor: theme.accentDoux }]}>
      <ThemedText type="small">{children}</ThemedText>
    </View>
  );
}

export function Chargement({ texte }: { texte?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.chargement}>
      <ActivityIndicator color={theme.accent} />
      {texte && (
        <ThemedText type="small" themeColor="textSecondary">
          {texte}
        </ThemedText>
      )}
    </View>
  );
}

export function CaseACocher({ coche, onPress, children }: { coche: boolean; onPress: () => void; children: ReactNode }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: coche }}
      onPress={onPress}
      style={[styles.case, { backgroundColor: theme.backgroundElement, borderColor: coche ? theme.text : theme.border }]}>
      <View style={[styles.coche, { borderColor: theme.text, backgroundColor: coche ? theme.text : 'transparent' }]}>
        {coche && <ThemedText style={[styles.signe, { color: theme.surTexte }]}>✓</ThemedText>}
      </View>
      <View style={styles.texteCase}>{children}</View>
    </Pressable>
  );
}

// Toute image produite reste signalée comme IA (promesse des fiches des stores).
export function BadgeIA() {
  return (
    <View style={styles.badgeIA} accessible accessibilityLabel="Image créée par IA">
      <Etincelle taille={6} couleur="#FFFFFF" />
      <ThemedText style={styles.badgeIATexte}>Créée par IA</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  contenu: { paddingHorizontal: 20, paddingTop: Spacing.three, paddingBottom: Spacing.five, gap: 20 },
  centre: { flexGrow: 1, justifyContent: 'center' },
  barre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
  barreGauche: { flex: 1 },
  // Écran centré : la barre (logo, croix) reste en haut.
  barreHaut: { paddingHorizontal: 20, paddingTop: Spacing.three },
  titres: { gap: Spacing.two, marginTop: Spacing.two, marginBottom: Spacing.one },
  intro: { fontSize: 17, lineHeight: 25 },
  fermer: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  trait: { position: 'absolute', width: 15, height: 2, borderRadius: 1 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mot: { fontFamily: Police.gras, letterSpacing: -1 },
  carte: { borderRadius: Rayon.grand, borderWidth: 1, padding: 20, gap: Spacing.three, overflow: 'hidden' },
  puce: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  etoile: { height: 24, justifyContent: 'center', paddingLeft: 2 },
  surtitre: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textePuce: { flex: 1 },
  section: { gap: 12 },
  titreSection: { gap: 2 },
  message: { borderRadius: Rayon.petit, paddingVertical: 12, paddingHorizontal: Spacing.three },
  chargement: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: Spacing.two },
  case: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', borderRadius: Rayon.moyen, borderWidth: 1.5, padding: Spacing.three },
  coche: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, marginTop: 1, alignItems: 'center', justifyContent: 'center' },
  signe: { fontSize: 13, lineHeight: 16, fontFamily: Police.gras },
  texteCase: { flex: 1 },
  badgeIA: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Rayon.pilule,
    backgroundColor: 'rgba(11,11,15,0.62)',
  },
  badgeIATexte: { color: '#FFFFFF', fontFamily: Police.demiGras, fontSize: 11, lineHeight: 15 },
});
