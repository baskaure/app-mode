import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Espace, Police, Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Carte({ children, style, accent = false }: { children: ReactNode; style?: ViewStyle; accent?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.carte,
        { backgroundColor: accent ? theme.accentDoux : theme.backgroundElement, borderColor: accent ? 'transparent' : theme.border },
        style,
      ]}>
      {children}
    </View>
  );
}

// Pas de losange rose devant les surtitres ni les listes (demande de l'utilisateur, 16 oct. 2026) :
// le texte seul pour un surtitre, un petit rond discret pour une puce.
export function Surtitre({ children, couleur }: { children: ReactNode; couleur?: string }) {
  const theme = useTheme();
  return (
    <ThemedText type="eyebrow" style={{ color: couleur ?? theme.accentTexte }}>
      {children}
    </ThemedText>
  );
}

// Une ligne de liste précédée d'un petit rond gris.
export function Puce({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.puce}>
      <View style={styles.repere}>
        <View style={[styles.rond, { backgroundColor: theme.textSecondary }]} />
      </View>
      <ThemedText style={styles.textePuce}>{children}</ThemedText>
    </View>
  );
}

export function ListePuces({ elements }: { elements: string[] }) {
  return (
    <View style={styles.liste}>
      {elements.map((e) => (
        <Puce key={e}>{e}</Puce>
      ))}
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
  if (!children) return null;
  return (
    <View style={[styles.message, { backgroundColor: theme.accentDoux }]}>
      <ThemedText type="small">{children}</ThemedText>
    </View>
  );
}

// Petit texte gris centré (mention légale, précision sous un bouton).
export function Mention({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.mention}>
      {children}
    </ThemedText>
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

// Barre d'avancement (questionnaire, attente de l'essayage). valeur : de 0 à 1.
export function BarreProgression({ valeur, epaisse = false }: { valeur: number; epaisse?: boolean }) {
  const theme = useTheme();
  const hauteur = epaisse ? 6 : 4;
  return (
    <View
      style={[styles.rail, { height: hauteur, backgroundColor: epaisse ? theme.backgroundElement : theme.border }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(valeur * 100) }}>
      <View style={{ height: hauteur, width: `${Math.min(1, Math.max(0, valeur)) * 100}%`, backgroundColor: theme.text, borderRadius: Rayon.pilule }} />
    </View>
  );
}

// Petite étiquette arrondie : « Ta photo » posée sur une image (surPhoto), ou une info dans le texte (« Silhouette en A »).
export function Etiquette({ texte, surPhoto = false }: { texte: string; surPhoto?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        surPhoto ? styles.etiquetteSurPhoto : styles.etiquette,
        { backgroundColor: theme.backgroundElement, borderColor: surPhoto ? 'transparent' : theme.border },
      ]}>
      <ThemedText type="smallBold">{texte}</ThemedText>
    </View>
  );
}

// Toute image produite reste signalée comme IA (promesse des fiches des stores).
export function BadgeIA() {
  return (
    <View style={styles.badgeIA} accessible accessibilityLabel="Image créée par IA">
      <ThemedText style={styles.badgeIATexte}>Créée par IA</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  carte: { borderRadius: Rayon.grand, borderWidth: 1, padding: Espace.xl, gap: Espace.l, overflow: 'hidden' },
  puce: { flexDirection: 'row', gap: Espace.m, alignItems: 'flex-start' },
  repere: { height: 24, justifyContent: 'center', paddingLeft: Espace.xxs },
  rond: { width: 5, height: 5, borderRadius: 2.5 },
  textePuce: { flex: 1 },
  liste: { gap: Espace.m },
  section: { gap: Espace.m },
  titreSection: { gap: Espace.xxs },
  message: { borderRadius: Rayon.petit, paddingVertical: Espace.m, paddingHorizontal: Espace.l },
  mention: { textAlign: 'center' },
  chargement: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Espace.m, paddingVertical: Espace.s },
  case: { flexDirection: 'row', gap: Espace.m, alignItems: 'flex-start', borderRadius: Rayon.moyen, borderWidth: 1.5, padding: Espace.l },
  coche: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, marginTop: 1, alignItems: 'center', justifyContent: 'center' },
  signe: { fontSize: 13, lineHeight: 16, fontFamily: Police.gras },
  texteCase: { flex: 1 },
  rail: { borderRadius: Rayon.pilule, overflow: 'hidden' },
  etiquette: { alignSelf: 'flex-start', paddingHorizontal: Espace.m, paddingVertical: Espace.xs, borderRadius: Rayon.pilule, borderWidth: 1 },
  etiquetteSurPhoto: { position: 'absolute', top: Espace.m, left: Espace.m, paddingHorizontal: Espace.m, paddingVertical: Espace.xs, borderRadius: Rayon.pilule },
  badgeIA: {
    position: 'absolute',
    top: Espace.m,
    left: Espace.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.xs,
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.xs,
    borderRadius: Rayon.pilule,
    backgroundColor: 'rgba(11,11,15,0.62)',
  },
  badgeIATexte: { color: '#FFFFFF', fontFamily: Police.demiGras, fontSize: 11, lineHeight: 15 },
});
