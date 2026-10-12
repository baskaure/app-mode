import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useProfil } from '@/state/profil';

export default function TabsLayout() {
  const { onboardingFini } = useProfil();
  if (!onboardingFini) return <Redirect href="/onboarding" />;
  return <AppTabs />;
}
