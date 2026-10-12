// Ce qu'on garde d'un partage reçu d'une autre app (Zara, Vinted, Instagram, Photos…).
// Sans import : testé par src/lib/partage.test.ts (npm run test:partage).

export type Partage = { type: 'image'; uri: string } | { type: 'lien'; url: string } | { type: 'rien' };

// Forme commune aux charges brutes et résolues d'expo-sharing (SharePayload / ResolvedSharePayload).
export type Charge = {
  value: string;
  shareType: string;
  mimeType?: string;
  contentType?: string | null;
  contentUri?: string | null;
};

// Premier lien http(s) d'un texte, sans la ponctuation collée à la fin
// (« Regarde ce produit https://www.zara.com/fr/… ! »).
export function extraireLien(texte: string): string | null {
  const trouve = texte.match(/https?:\/\/[^\s<>"'«»]+/i);
  if (!trouve) return null;
  const lien = trouve[0].replace(/[.,;:!?)\]}]+$/, '');
  // Hôte lu à la main, comme pour estLienDePartage : il doit contenir un point (pas de localhost).
  const hote = lien.match(/^https?:\/\/([^/?#:]+)/i)?.[1] ?? '';
  return /^[^.]+(\.[^.]+)+$/.test(hote) ? lien : null;
}

function estImage(c: Charge): boolean {
  return c.contentType === 'image' || c.shareType === 'image' || (c.mimeType ?? '').startsWith('image/');
}

// Une capture d'écran passe avant un lien : la plupart des sites de mode bloquent la lecture des liens.
export function lirePartage(charges: Charge[]): Partage {
  const image = charges.find(estImage);
  const uri = image?.contentUri || image?.value;
  if (uri) return { type: 'image', uri };

  for (const c of charges) {
    const lien = extraireLien(c.value ?? '');
    if (lien) return { type: 'lien', url: lien };
  }
  return { type: 'rien' };
}

// Lien d'ouverture envoyé par expo-sharing : `appmode://expo-sharing…`. Pas de `new URL().hostname` :
// selon les versions, l'URL de React Native ne lit pas bien l'hôte d'un schéma maison.
export function estLienDePartage(chemin: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\/expo-sharing(?:[/?#]|$)/i.test(chemin);
}

export type Etape = 'attendre' | 'vide' | 'resolues' | 'brutes';

// Quand traiter le partage. Le hook useIncomingShare part avec isResolving=false et aucune charge résolue :
// la résolution ne démarre qu'après le premier rendu. On attend donc les charges résolues (copie locale de
// l'image sur Android), et on ne retombe sur les brutes qu'en cas d'erreur ou après le délai d'attente.
export function etapePartage(e: {
  pret: boolean;
  nbBrutes: number;
  nbResolues: number;
  isResolving: boolean;
  erreur: boolean;
  delaiPasse: boolean;
}): Etape {
  if (!e.pret) return 'attendre';
  if (e.nbBrutes === 0) return 'vide';
  if (e.isResolving) return e.delaiPasse ? 'brutes' : 'attendre';
  if (e.nbResolues > 0) return 'resolues';
  if (e.erreur || e.delaiPasse) return 'brutes';
  return 'attendre';
}
