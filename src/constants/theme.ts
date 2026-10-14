/**
 * Direction artistique Akalie (logo « Aura pastel », 14 oct. 2026) : crème, encre presque noire,
 * aura rose / pêche / lilas, une seule couleur vive (le rose de l'étoile). Police : Onest.
 */

import '@/global.css';

import { Platform } from 'react-native';

import { Colors } from '@/constants/couleurs';

export { Colors };

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Les couleurs de l'aura, pour les petites touches (badges, dégradés).
export const Aura = { rose: '#FFC2D1', peche: '#FFD9B0', lilas: '#C9B8FF' } as const;

// Onest chargée par useFonts (app/_layout.tsx). Sur Android, une famille par graisse : on choisit la famille,
// pas fontWeight.
export const Police = {
  normal: 'Onest_400Regular',
  moyen: 'Onest_500Medium',
  demiGras: 'Onest_600SemiBold',
  gras: 'Onest_700Bold',
  tresGras: 'Onest_800ExtraBold',
} as const;

export const Fonts = Platform.select({
  ios: { sans: Police.normal, mono: 'ui-monospace' },
  default: { sans: Police.normal, mono: 'monospace' },
  web: { sans: Police.normal, mono: 'var(--font-mono)' },
});

// Échelle d'espacements unique (15 oct. 2026) : marges, écarts et rembourrages ne prennent que ces valeurs.
export const Espace = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  enorme: 64,
} as const;

// Marge latérale de tous les écrans.
export const Gouttiere = Espace.xl;

export const Rayon = { petit: 12, moyen: 18, grand: 28, pilule: 999 } as const;

// Web : la barre d'onglets flotte au-dessus du contenu (app-tabs.web.tsx).
export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 88 }) ?? 0;
export const MaxContentWidth = 560;
