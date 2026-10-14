// Couleurs d'Akalie (charte graphique du 15 oct. 2026), sans dépendance : testées par couleurs.test.ts (npm test).
// Règle de lisibilité : tout couple texte / fond utilisé par l'app atteint 4,5:1 (WCAG AA).

export const Colors = {
  light: {
    text: '#0B0B0F',
    textSecondary: '#6B6470',
    background: '#FFF7F2',
    // Cartes et champs : blanc posé sur le crème.
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FBE7EC',
    border: '#EFE3E1',
    // Rose de l'étoile : formes, badges, grands titres. Trop pâle pour du petit texte sur crème (3,2:1).
    accent: '#FF3D8B',
    // Petit texte en rose (5,6:1 sur crème) et fond des badges à texte clair.
    accentTexte: '#BF1D63',
    // Rose posé sur une carte encre (couleur `text`) : celle du thème inverse.
    accentInverse: '#FF3D8B',
    accentDoux: '#FFE1EC',
    surTexte: '#FFF7F2',
    erreur: '#C5221F',
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
    accentTexte: '#FF5C9E',
    accentInverse: '#BF1D63',
    accentDoux: '#3A1828',
    surTexte: '#0B0B0F',
    erreur: '#FF8A80',
    erreurFond: '#3A1A1A',
  },
} as const;
