// Verrou de lisibilité des couleurs (WCAG AA, 4,5:1 pour le texte) : npm test.
// Le 15 oct. 2026, le rose de l'étoile servait à du petit texte sur crème (3,2:1) : chaque couple texte / fond
// réellement utilisé par l'app est listé ici, dans les deux thèmes.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Colors } from './couleurs.ts';

type Cle = keyof typeof Colors.light;

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a: string, b: string): number {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair + 0.05) / (sombre + 0.05);
}

// [texte, fond, où dans l'app]
const COUPLES: [Cle, Cle, string][] = [
  ['text', 'background', 'texte courant'],
  ['text', 'backgroundElement', 'texte dans les cartes'],
  ['text', 'backgroundSelected', 'choix sélectionné'],
  ['text', 'accentDoux', 'cartes mises en avant'],
  ['textSecondary', 'background', 'texte secondaire'],
  ['textSecondary', 'backgroundElement', 'texte secondaire dans les cartes'],
  ['textSecondary', 'accentDoux', 'texte secondaire dans les cartes mises en avant'],
  ['accentTexte', 'background', 'surtitres roses'],
  ['accentTexte', 'backgroundElement', 'raisons sous les articles'],
  ['accentTexte', 'accentDoux', 'surtitre « Pourquoi pour toi »'],
  ['surTexte', 'text', 'boutons principaux, pastilles choisies'],
  ['surTexte', 'accentTexte', 'badge « -50 % » du paywall'],
  ['accentInverse', 'text', 'surtitre de la carte « Offre complète »'],
  ['erreur', 'erreurFond', 'messages d’erreur'],
];

for (const theme of ['light', 'dark'] as const) {
  test(`thème ${theme} : chaque texte atteint 4,5:1 sur son fond`, () => {
    const c = Colors[theme];
    const echecs = COUPLES.map(([t, f, ou]) => ({ ou, ratio: contraste(c[t], c[f]) }))
      .filter((x) => x.ratio < 4.5)
      .map((x) => `${x.ou} : ${x.ratio.toFixed(2)}:1`);
    assert.deepEqual(echecs, []);
  });
}
