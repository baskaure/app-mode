import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { Icone, type NomIcone } from './ui';

import { Espace, Gouttiere, MaxContentWidth, Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Mêmes icônes que les onglets natifs (app-tabs.tsx), en Material Symbols sur le web.
const ICONES_ONGLETS = {
  essayer: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  inspirations: { ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' },
  essayages: { ios: 'photo.on.rectangle', android: 'photo_library', web: 'photo_library' },
  dressing: { ios: 'hanger', android: 'checkroom', web: 'checkroom' },
} as const satisfies Record<string, NomIcone>;

export default function AppTabs() {
  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icone={ICONES_ONGLETS.essayer}>Essayer</TabButton>
          </TabTrigger>
          <TabTrigger name="inspirations" href="/inspirations" asChild>
            <TabButton icone={ICONES_ONGLETS.inspirations}>Inspirations</TabButton>
          </TabTrigger>
          <TabTrigger name="historique" href="/historique" asChild>
            <TabButton icone={ICONES_ONGLETS.essayages}>Essayages</TabButton>
          </TabTrigger>
          <TabTrigger name="dressing" href="/dressing" asChild>
            <TabButton icone={ICONES_ONGLETS.dressing}>Dressing</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

// Icône + libellé court, comme la barre native : tient à 4 onglets dès 320 px de large.
export function TabButton({ children, isFocused, icone, ...props }: TabTriggerSlotProps & { icone: NomIcone }) {
  const theme = useTheme();
  const couleur = isFocused ? theme.surTexte : theme.textSecondary;
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.bouton, isFocused && { backgroundColor: theme.text }, pressed && styles.enfonce]}>
      <Icone nom={icone} taille={20} couleur={couleur} />
      <ThemedText type="smallBold" numberOfLines={1} style={[styles.libelle, { color: couleur }]}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

// Barre flottante en pilule, posée au-dessus du contenu.
export function CustomTabList(props: TabListProps) {
  const theme = useTheme();
  return (
    <View {...props} style={styles.conteneur}>
      <View style={[styles.barre, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    position: 'absolute',
    bottom: Espace.l,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Gouttiere,
  },
  barre: {
    flexDirection: 'row',
    gap: Espace.xs,
    padding: Espace.xs,
    borderRadius: Rayon.pilule,
    borderWidth: 1,
    width: '100%',
    maxWidth: MaxContentWidth - 80,
    boxShadow: '0 10px 30px rgba(11,11,15,0.10)',
  },
  bouton: { flex: 1, minWidth: 0, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: Espace.xxs, borderRadius: Rayon.grand },
  libelle: { fontSize: 11, lineHeight: 14 },
  enfonce: { opacity: 0.7 },
});
