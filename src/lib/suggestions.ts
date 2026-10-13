// Idées de pièces selon le style et la silhouette (version rapide, sans catalogue : idée du 13 oct. 2026).
// Les pièces viennent des règles de morphologie ; le style donne le mot-clé de la recherche.
// Chaque idée ouvre une recherche Vinted ou Google Shopping : on trouve l'article, puis on le partage vers l'app.
// Sans import de valeur : testé par suggestions.test.ts (npm test). Les pièces arrivent de conseilPour().aPrivilegier.
import type { Vestiaire } from '@/lib/morphologie';
import type { Style } from '@/state/profil';

const STYLES: Record<Style, { mot: string; touche: string }> = {
  casual: { mot: 'casual', touche: 'matières simples, coton et denim' },
  chic: { mot: 'élégant', touche: 'coupes nettes et tons neutres' },
  streetwear: { mot: 'streetwear', touche: 'coupes amples et sneakers' },
  clean_girl: { mot: 'minimaliste', touche: 'basiques ajustés et tons doux' },
  minimaliste: { mot: 'minimaliste', touche: 'peu de pièces, bien coupées, sans logo' },
  boheme: { mot: 'bohème', touche: 'matières fluides, motifs et tons naturels' },
  workwear: { mot: 'workwear', touche: 'toile épaisse, poches et tons terre' },
  alternatif: { mot: 'vintage', touche: 'pièces fortes, seconde main et contrastes' },
};

export type Suggestion = { piece: string; requete: string; vinted: string; google: string };

// « jeans droits ou évasés » → « jeans droits » ; « superpositions (surchemise, veste) » → « superpositions ».
function premiereOption(regle: string): string {
  return regle.replace(/\(.*?\)/g, '').split(' ou ')[0].trim();
}

export function touche(style: Style): string {
  return STYLES[style].touche;
}

export function suggestions(aPrivilegier: string[], style: Style, vestiaire: Vestiaire, max = 4): Suggestion[] {
  const { mot } = STYLES[style];
  return aPrivilegier
    .slice(0, max)
    .map((regle) => {
      const piece = premiereOption(regle);
      const requete = `${piece} ${mot} ${vestiaire}`;
      const q = encodeURIComponent(requete);
      return {
        piece: piece.charAt(0).toUpperCase() + piece.slice(1),
        requete,
        vinted: `https://www.vinted.fr/catalog?search_text=${q}`,
        google: `https://www.google.com/search?tbm=shop&q=${q}`,
      };
    });
}
