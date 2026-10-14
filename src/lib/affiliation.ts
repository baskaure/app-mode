// Lien d'achat affilié vers l'article essayé. Sans import : testé par affiliation.test.ts (npm test).
// Réseau pris en charge : Awin (format officiel : https://www.awin1.com/cread.php?awinmid=…&awinaffid=…&ued=…).
// Un marchand n'est affilié que s'il figure dans la table `marchands_affilies` (programme accepté chez Awin).
// Sinon, ou sans identifiant d'éditeur, on ouvre simplement l'article : le bouton reste utile.

export type Marchand = { domaine: string; reseau: 'awin'; id_annonceur: string };
export type LienAchat = { url: string; affilie: boolean };

// Hôte d'une adresse http(s), en minuscules, sans « www. ». Lu à la main (pas de new URL côté app : voir partage.ts).
export function hoteDe(url: string): string | null {
  // Antislash refusé : un navigateur lit « https://evil.com\.marchand.fr » comme evil.com.
  const hote = url.trim().match(/^https?:\/\/([^/?#:@\s\\]+)(?::\d+)?(?:[/?#]|$)/i)?.[1]?.toLowerCase();
  if (url.includes('\\')) return null;
  if (!hote || !/^[^.]+(\.[^.]+)+$/.test(hote)) return null;
  return hote.replace(/^www\./, '');
}

// « fr.zalando.fr » correspond au marchand « zalando.fr » ; « fauxzalando.fr » non.
export function trouverMarchand(hote: string, marchands: Marchand[]): Marchand | null {
  return marchands.find((m) => hote === m.domaine || hote.endsWith(`.${m.domaine}`)) ?? null;
}

export function lienAchat(urlArticle: string | null, marchands: Marchand[], idEditeur: string | undefined): LienAchat | null {
  if (!urlArticle) return null;
  const hote = hoteDe(urlArticle);
  if (!hote) return null;
  const url = urlArticle.trim();
  // Lien déjà affilié (deep link d'un flux produits Awin, catalogue) : on l'ouvre tel quel.
  if (hote === 'awin1.com') return { url, affilie: true };
  const marchand = trouverMarchand(hote, marchands);
  if (!marchand || !idEditeur) return { url, affilie: false };
  const parametres = [
    `awinmid=${encodeURIComponent(marchand.id_annonceur)}`,
    `awinaffid=${encodeURIComponent(idEditeur)}`,
    `ued=${encodeURIComponent(url)}`,
  ].join('&');
  return { url: `https://www.awin1.com/cread.php?${parametres}`, affilie: true };
}
