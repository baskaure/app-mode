// Lecture d'un flux produits Awin (CSV « Create-a-Feed ») et conversion en lignes de la table articles.
// Sans import : testé par awin.test.ts (npm test), utilisé par scripts/importer-awin.mjs.
// Colonnes lues (noms standard d'Awin, à confirmer sur le premier vrai flux) : aw_product_id, product_name,
// aw_deep_link, aw_image_url, merchant_image_url, large_image, search_price, currency, merchant_name, brand_name,
// merchant_category, category_name, colour, product_type, Fashion:category, Fashion:suitable_for.

export type LigneArticle = {
  source: 'awin';
  id_source: string;
  marchand: string;
  marque: string | null;
  nom: string;
  prix: number | null;
  devise: string;
  image_url: string;
  lien: string;
  categorie: 'haut' | 'bas' | 'robe' | 'veste' | 'chaussures' | 'accessoire';
  couleur: string | null;
  vestiaire: 'femme' | 'homme' | 'mixte';
  styles: string[];
};

// CSV avec guillemets (virgules et retours à la ligne permis entre guillemets, "" pour un guillemet).
export function lireCsv(texte: string, separateur = ','): Record<string, string>[] {
  const lignes: string[][] = [];
  let ligne: string[] = [];
  let champ = '';
  let entreGuillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (entreGuillemets) {
      if (c === '"' && texte[i + 1] === '"') {
        champ += '"';
        i++;
      } else if (c === '"') entreGuillemets = false;
      else champ += c;
    } else if (c === '"') entreGuillemets = true;
    else if (c === separateur) {
      ligne.push(champ);
      champ = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texte[i + 1] === '\n') i++;
      ligne.push(champ);
      if (ligne.some((x) => x !== '')) lignes.push(ligne);
      ligne = [];
      champ = '';
    } else champ += c;
  }
  ligne.push(champ);
  if (ligne.some((x) => x !== '')) lignes.push(ligne);
  const [entete, ...reste] = lignes;
  if (!entete) return [];
  const noms = entete.map((n) => n.trim().replace(/^\uFEFF/, ''));
  return reste.map((l) => Object.fromEntries(noms.map((n, i) => [n, (l[i] ?? '').trim()])));
}

const sans = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const contient = (texte: string, mots: string[]) => mots.some((m) => new RegExp(`(^|[^a-z])${m}`).test(texte));

// Jamais dans le catalogue : l'essayage les refuse (filtre de l'Edge Function essayage).
const EXCLUS = ['lingerie', 'soutien-gorge', 'culotte', 'string', 'maillot de bain', 'bikini', 'pyjama', 'nuisette', 'swimwear', 'underwear', 'bra'];

const CATEGORIES: [LigneArticle['categorie'], string[]][] = [
  ['chaussures', ['chaussure', 'basket', 'sneaker', 'botte', 'bottine', 'boots', 'escarpin', 'sandale', 'mocassin', 'derby', 'derbies', 'shoe', 'trainer', 'loafer', 'mule']],
  ['robe', ['robe', 'combinaison', 'dress', 'jumpsuit']],
  ['veste', ['veste', 'manteau', 'blazer', 'blouson', 'parka', 'doudoune', 'trench', 'jacket', 'coat']],
  ['bas', ['pantalon', 'jean', 'jupe', 'short', 'legging', 'chino', 'cargo', 'trouser', 'skirt', 'jogging']],
  ['haut', ['t-shirt', 'tee', 'chemise', 'blouse', 'top', 'pull', 'sweat', 'hoodie', 'debardeur', 'polo', 'cardigan', 'gilet', 'shirt', 'sweater', 'jumper', 'maille']],
  ['accessoire', ['sac', 'ceinture', 'echarpe', 'bonnet', 'chapeau', 'casquette', 'bag', 'belt', 'scarf', 'hat', 'cap']],
];

const COULEURS: [string, string[]][] = [
  ['motif', ['imprime', 'print', 'raye', 'rayure', 'stripe', 'fleuri', 'floral', 'leopard', 'carreaux', 'check', 'camouflage', 'camo', 'multicolore', 'multi']],
  ['marine', ['marine', 'navy']],
  ['noir', ['noir', 'black']],
  ['blanc', ['blanc', 'white']],
  ['beige', ['beige', 'ecru', 'sable', 'creme', 'cream', 'ivoire', 'ivory', 'sand', 'stone']],
  ['gris', ['gris', 'grey', 'gray', 'anthracite', 'chine']],
  ['bleu', ['bleu', 'blue', 'denim', 'indigo']],
  ['marron', ['marron', 'brown', 'chocolat', 'camel', 'cognac', 'taupe']],
  ['kaki', ['kaki', 'khaki', 'olive']],
  ['vert', ['vert', 'green']],
  ['rouge', ['rouge', 'red', 'bordeaux', 'burgundy']],
  ['rose', ['rose', 'pink', 'fuchsia']],
  ['jaune', ['jaune', 'yellow', 'moutarde', 'mustard']],
  ['violet', ['violet', 'purple', 'lilas', 'lilac', 'prune', 'mauve']],
  ['orange', ['orange', 'terracotta', 'rouille', 'rust', 'corail', 'coral']],
];

const STYLES: [string, string[]][] = [
  ['chic', ['blazer', 'tailleur', 'satin', 'soie', 'escarpin', 'costume', 'derby', 'derbies', 'chemise', 'laine', 'cachemire', 'trench', 'plisse']],
  ['streetwear', ['hoodie', 'capuche', 'cargo', 'sneaker', 'basket', 'oversize', 'jogging', 'sweat', 'logo', 'graphique']],
  ['boheme', ['fleuri', 'floral', 'crochet', 'lin', 'volant', 'brode', 'maxi', 'fluide', 'franges']],
  ['clean_girl', ['basique', 'cotele', 'ajuste', 'maille', 'col rond', 'body', 'bandeau']],
  ['minimaliste', ['basique', 'uni', 'col rond', 'col roule', 'droit', 'essentiel']],
  ['workwear', ['carpenter', 'canvas', 'toile', 'worker', 'overshirt', 'surchemise', 'dickies', 'carhartt', 'duck']],
  ['alternatif', ['vintage', 'cuir', 'clous', 'rangers', 'leopard', 'resille', 'grunge', 'punk', 'gothique']],
  ['casual', ['jean', 't-shirt', 'pull', 'chino', 'denim', 'sweat', 'baskets']],
];

function categorieDe(texte: string): LigneArticle['categorie'] | null {
  for (const [categorie, mots] of CATEGORIES) if (contient(texte, mots)) return categorie;
  return null;
}

function vestiaireDe(texte: string): LigneArticle['vestiaire'] {
  const femme = contient(texte, ['femme', 'women', 'woman', 'female', 'ladies', 'fille']);
  const homme = contient(texte, ['homme', 'men', 'man', 'male', 'garcon']);
  if (contient(texte, ['unisex', 'mixte'])) return 'mixte';
  if (femme && !homme) return 'femme';
  if (homme && !femme) return 'homme';
  return 'mixte';
}

function https(url: string | undefined): string | null {
  return url && /^https:\/\//.test(url) ? url : null;
}

export function versArticle(l: Record<string, string>): LigneArticle | null {
  const nom = l.product_name;
  const id = l.aw_product_id;
  const lien = https(l.aw_deep_link);
  const image = https(l.aw_image_url) ?? https(l.large_image) ?? https(l.merchant_image_url);
  if (!nom || !id || !lien || !image) return null;

  const categories = sans([l['Fashion:category'], l.merchant_category, l.category_name, l.product_type].filter(Boolean).join(' '));
  const texte = sans(`${nom} ${categories}`);
  if (contient(texte, EXCLUS)) return null;
  const categorie = categorieDe(sans(`${categories} ${nom}`)) ?? null;
  if (!categorie) return null;

  const texteCouleur = sans(`${l.colour ?? ''} ${nom}`);
  const couleur = COULEURS.find(([, mots]) => contient(texteCouleur, mots))?.[0] ?? null;
  const styles = STYLES.filter(([, mots]) => contient(texte, mots)).map(([s]) => s);
  const prix = Number.parseFloat((l.search_price ?? '').replace(',', '.'));

  return {
    source: 'awin',
    id_source: id,
    marchand: l.merchant_name || l.brand_name || 'Boutique',
    marque: l.brand_name || null,
    nom,
    prix: Number.isFinite(prix) && prix >= 0 ? Math.round(prix * 100) / 100 : null,
    devise: l.currency || 'EUR',
    image_url: image,
    lien,
    categorie,
    couleur,
    vestiaire: vestiaireDe(sans(`${l['Fashion:suitable_for'] ?? ''} ${categories} ${nom}`)),
    styles: styles.length ? styles : ['casual'],
  };
}
