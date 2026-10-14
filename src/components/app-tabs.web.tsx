import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { MaxContentWidth, Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Essayer</TabButton>
          </TabTrigger>
          <TabTrigger name="historique" href="/historique" asChild>
            <TabButton>Essayages</TabButton>
          </TabTrigger>
          <TabTrigger name="dressing" href="/dressing" asChild>
            <TabButton>Dressing</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const theme = useTheme();
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.bouton, isFocused && { backgroundColor: theme.text }, pressed && styles.enfonce]}>
      <ThemedText type="smallBold" style={{ color: isFocused ? theme.surTexte : theme.textSecondary }}>
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
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  barre: {
    flexDirection: 'row',
    gap: 4,
    padding: 5,
    borderRadius: Rayon.pilule,
    borderWidth: 1,
    width: '100%',
    maxWidth: MaxContentWidth - 80,
    boxShadow: '0 10px 30px rgba(11,11,15,0.10)',
  },
  bouton: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: Rayon.pilule },
  enfonce: { opacity: 0.7 },
});
