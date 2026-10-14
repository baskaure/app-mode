/**
 * Direction artistique Akalie (logo « Aura pastel », 14 oct. 2026) : crème, encre presque noire,
 * aura rose / pêche / lilas, une seule couleur vive (le rose de l'étoile). Police : Onest.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B0B0F',
    textSecondary: '#6B6470',
    background: '#FFF7F2',
    // Cartes et champs : blanc posé sur le crème.
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FBE7EC',
    border: '#EFE3E1',
    accent: '#FF3D8B',
    accentDoux: '#FFE1EC',
    surTexte: '#FFF7F2',
    erreur: '#D93025',
    erreurFond: '#FDECEA',
  },
  dark: {
    text: '#FFF7F2',
    textSecondary: '#A9A2AE',
    background: '#0B0B0F',
    backgroundElement: '#17151C',
    backgroundSelected: '#2A1F2A',
    border: '#2A2631',
    accent: '#FF5C9E',
    accentDoux: '#3A1828',
    surTexte: '#0B0B0F',
    erreur: '#FF8A80',
    erreurFond: '#3A1A1A',
  },
} as const;

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

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Rayon = { petit: 12, moyen: 18, grand: 28, pilule: 999 } as const;

// Web : la barre d'onglets flotte au-dessus du contenu (app-tabs.web.tsx).
export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 76 }) ?? 0;
export const MaxContentWidth = 560;
