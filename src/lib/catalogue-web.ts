// Catalogue « Trouvé sur le web » (15 oct. 2026) : de vrais articles Google Shopping, via SerpApi, en attendant
// les marques partenaires (Awin). Recherches génériques (vestiaire × style × type de pièce) : aucune donnée
// d'utilisateur n'est envoyée à SerpApi. Sans import de valeur : testé par catalogue-web.test.ts (npm test),
// utilisé par scripts/importer-web.mjs.

type Categorie = 'haut' | 'bas' | 'robe' | 'veste' | 'chaussures';
type Couleur =
  | 'noir'
  | 'blanc'
  | 'beige'
  | 'gris'
  | 'marine'
  | 'bleu'
  | 'marron'
  | 'kaki'
  | 'vert'
  | 'rouge'
  | 'rose'
  | 'jaune'
  | 'violet'
  | 'orange'
  | 'motif';
type Vestiaire = 'femme' | 'homme';
type Style = 'casual' | 'chic' | 'streetwear' | 'clean_girl' | 'minimaliste' | 'boheme' | 'workwear' | 'alternatif';

const STYLES_FEMME: Style[] = ['casual', 'chic', 'streetwear', 'clean_girl', 'boheme', 'alternatif'];
const STYLES_HOMME: Style[] = ['casual', 'chic', 'streetwear', 'minimaliste', 'workwear', 'alternatif'];

// Mot ajouté à la recherche pour chaque style (mêmes mots que src/lib/suggestions.ts).
const MOT_STYLE: Record<Style, string> = {
  casual: 'casual',
  chic: 'élégant',
  streetwear: 'streetwear',
  clean_girl: 'minimaliste',
  minimaliste: 'minimaliste',
  boheme: 'bohème',
  workwear: 'workwear',
  alternatif: 'vintage',
};

const PIECES: Record<Vestiaire, Partial<Record<Categorie, string>>> = {
  femme: { haut: 'top', bas: 'pantalon', robe: 'robe', veste: 'veste', chaussures: 'baskets' },
  homme: { haut: 't-shirt', bas: 'pantalon', veste: 'veste', chaussures: 'baskets' },
};

export type Requete = { requete: string; vestiaire: Vestiaire; style: Style; categorie: Categorie };

// 6 styles × 5 pièces (femme) + 6 styles × 4 pièces (homme) = 54 recherches par import.
export function requetesCatalogue(): Requete[] {
  const liste: Requete[] = [];
  for (const vestiaire of ['femme', 'homme'] as const) {
    for (const style of vestiaire === 'femme' ? STYLES_FEMME : STYLES_HOMME) {
      for (const [categorie, nom] of Object.entries(PIECES[vestiaire]) as [Categorie, string][]) {
        liste.push({ requete: `${nom} ${MOT_STYLE[style]} ${vestiaire}`, vestiaire, style, categorie });
      }
    }
  }
  return liste;
}

const MOTS_COULEUR: [RegExp, Couleur][] = [
  [/\b(multicolore|imprim[ée]|motifs?|rayures?|ray[ée]|carreaux|fleuri|l[ée]opard)\b/i, 'motif'],
  [/\b(bleu marine|marine)\b/i, 'marine'],
  [/\b(noir|noire|black)\b/i, 'noir'],
  [/\b(blanc|blanche|[ée]cru|ivoire|white)\b/i, 'blanc'],
  [/\b(beige|camel|sable|cr[èe]me)\b/i, 'beige'],
  [/\b(gris|grise|anthracite|grey)\b/i, 'gris'],
  [/\b(bleu|bleue|denim|jean)\b/i, 'bleu'],
  [/\b(marron|chocolat|cognac|brun)\b/i, 'marron'],
  [/\b(kaki)\b/i, 'kaki'],
  [/\b(vert|verte|olive)\b/i, 'vert'],
  [/\b(rouge|bordeaux)\b/i, 'rouge'],
  [/\b(rose|fuchsia)\b/i, 'rose'],
  [/\b(jaune|moutarde)\b/i, 'jaune'],
  [/\b(violet|violette|lilas)\b/i, 'violet'],
  [/\b(orange|rouille)\b/i, 'orange'],
];

export function couleurDuTitre(titre: string): Couleur | null {
  for (const [motif, couleur] of MOTS_COULEUR) if (motif.test(titre)) return couleur;
  return null;
}

// Un résultat « shopping_results » de SerpApi (moteur google_shopping), champs lus sur serpapi.com le 15 oct. 2026.
export type ResultatShopping = {
  title?: unknown;
  product_id?: unknown;
  product_link?: unknown;
  source?: unknown;
  extracted_price?: unknown;
  thumbnail?: unknown;
};

export type LigneArticle = {
  source: 'web';
  id_source: string;
  marchand: string;
  marque: null;
  nom: string;
  prix: number | null;
  devise: 'EUR';
  image_url: string;
  lien: string;
  categorie: Categorie;
  couleur: Couleur | null;
  vestiaire: Vestiaire;
  styles: Style[];
  actif: true;
};

const texte = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

// Au-delà, hors de la cible (18-40 ans, achats en ligne courants) : réglé le 15 oct. 2026 après le 1er import.
export const PRIX_MAX = 150;

// « Robe chemise en popeline Femme Taille » → « Robe chemise en popeline » ;
// « Acne Studios, Top en coton, femme, gris, FR 34, tops » → « Acne Studios, Top en coton ».
export function nettoyerTitre(titre: string): string {
  return titre
    .replace(/,\s*(femme|homme)\b.*$/i, '')
    .replace(/[\s,-]*\b(femme|homme)?\s*(taille\b.*)?$/i, (m) => (/taille|femme|homme/i.test(m) ? '' : m))
    .trim();
}

// Vendeurs écartés (16 oct. 2026, d'après le 1er import) : places de marché et vendeurs tiers (titres à rallonge,
// marques inconnues), impression à la demande, enseignes hors mode. Le tri fin (enfants, déguisements, hors sujet)
// est fait ensuite par l'IA (Edge Function etiqueter-articles).
const MARCHANDS_ECARTES =
  /(-\s*seller\b|marketplace|aliexpress|temu|wish\.com|joom|ebay|tostadora|grafitee|europosters|leroy merlin|gamm vert)/i;

export function marchandAccepte(marchand: string): boolean {
  return !MARCHANDS_ECARTES.test(marchand);
}

// Résultat incomplet (pas d'image, de lien ou de titre en https) ou vendeur écarté : écarté.
export function versArticle(r: ResultatShopping, q: Requete): LigneArticle | null {
  const nom = nettoyerTitre(texte(r.title)).slice(0, 200);
  const image = texte(r.thumbnail);
  const lien = texte(r.product_link);
  const id = texte(r.product_id) || lien;
  if (!nom || !id || !/^https:\/\//.test(image) || !/^https:\/\//.test(lien)) return null;
  if (!marchandAccepte(texte(r.source))) return null;
  const prix =
    typeof r.extracted_price === 'number' && r.extracted_price >= 0 ? Math.round(r.extracted_price * 100) / 100 : null;
  if (prix !== null && prix > PRIX_MAX) return null;
  // « baskets workwear » remonte des chaussures de sécurité : hors sujet pour la mode.
  if (/s[ée]curit[ée]/i.test(nom)) return null;
  return {
    source: 'web',
    id_source: id.slice(0, 300),
    marchand: texte(r.source).slice(0, 80) || 'Boutique en ligne',
    marque: null,
    nom,
    prix,
    devise: 'EUR',
    image_url: image,
    lien,
    categorie: q.categorie,
    couleur: couleurDuTitre(nom),
    vestiaire: q.vestiaire,
    styles: [q.style],
    actif: true,
  };
}

// 10 par recherche (8 avant le 16 oct.) : les vendeurs écartés laissent de la place, sans recherche de plus.
export const PAR_RECHERCHE = 10;
