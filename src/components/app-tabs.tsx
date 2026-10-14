import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Police } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.background}
      indicatorColor={theme.accentDoux}
      tintColor={theme.text}
      iconColor={{ default: theme.textSecondary, selected: theme.text }}
      labelStyle={{
        default: { color: theme.textSecondary, fontFamily: Police.moyen },
        selected: { color: theme.text, fontFamily: Police.demiGras },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Essayer</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" md="auto_awesome" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="historique">
        <NativeTabs.Trigger.Label>Essayages</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'photo.on.rectangle', selected: 'photo.fill.on.rectangle.fill' }} md="photo_library" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="dressing">
        <NativeTabs.Trigger.Label>Dressing</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="hanger" md="checkroom" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
