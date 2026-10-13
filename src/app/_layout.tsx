import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { CaptchaProvider } from '@/components/captcha';
import { ProfilProvider } from '@/state/profil';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <CaptchaProvider>
          <ProfilProvider>
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
              <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
              <Stack.Screen name="photo-soi" options={{ presentation: 'modal' }} />
              <Stack.Screen name="vetement" options={{ presentation: 'modal' }} />
              <Stack.Screen name="image" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="partage" options={{ presentation: 'modal' }} />
              <Stack.Screen name="supprimer-donnees" options={{ presentation: 'modal' }} />
            </Stack>
          </ProfilProvider>
        </CaptchaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
