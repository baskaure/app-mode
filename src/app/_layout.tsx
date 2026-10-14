import {
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
  Onest_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/onest';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { CaptchaProvider } from '@/components/captcha';
import { Colors } from '@/constants/theme';
import { ProfilProvider } from '@/state/profil';

SplashScreen.preventAutoHideAsync();

// Thèmes de navigation aux couleurs Akalie (fond des modales, transitions).
const themeClair = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.light.background, card: Colors.light.background, primary: Colors.light.accent },
};
const themeSombre = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: Colors.dark.background, card: Colors.dark.background, primary: Colors.dark.accent },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [policesPretes, erreurPolices] = useFonts({
    Onest_400Regular,
    Onest_500Medium,
    Onest_600SemiBold,
    Onest_700Bold,
    Onest_800ExtraBold,
  });
  // L'écran de lancement reste affiché tant que la police charge (sans police, on continue avec celle du système).
  if (!policesPretes && !erreurPolices) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? themeSombre : themeClair}>
        <CaptchaProvider>
          <ProfilProvider>
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
              <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
              <Stack.Screen name="photo-soi" options={{ presentation: 'modal' }} />
              <Stack.Screen name="vetement" options={{ presentation: 'modal' }} />
              <Stack.Screen name="article" options={{ presentation: 'modal' }} />
              <Stack.Screen name="image" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="partager" options={{ presentation: 'modal' }} />
              <Stack.Screen name="partage" options={{ presentation: 'modal' }} />
              <Stack.Screen name="supprimer-donnees" options={{ presentation: 'modal' }} />
            </Stack>
          </ProfilProvider>
        </CaptchaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
