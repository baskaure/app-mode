// Recommandation du catalogue (14 oct. 2026). Sans import de valeur : testé par catalogue-regles.test.ts (npm test).
// 1. « Pour ton style » : le style choisi au questionnaire, puis les coupes conseillées pour la silhouette.
// 2. « Avec ton dressing » : un article qui se porte avec une pièce du dressing (catégories qui s'associent,
//    couleurs qui vont ensemble), en priorité dans les catégories qui manquent au dressing.
// Les règles restent simples et lisibles : chaque article recommandé porte une raison affichée telle quelle.
import type { Vestiaire } from '@/lib/morphologie';
import type { Style } from '@/state/profil';

export type Categorie = 'haut' | 'bas' | 'robe' | 'veste' | 'chaussures' | 'accessoire';
export type Couleur =
  | 'noir' | 'blanc' | 'beige' | 'gris' | 'marine' | 'bleu' | 'marron' | 'kaki' | 'vert'
  | 'rouge' | 'rose' | 'jaune' | 'violet' | 'orange' | 'motif';

export type Article = {
  id: string;
  source: 'awin' | 'test' | 'web';
  marchand: string;
  marque: string | null;
  nom: string;
  prix: number | null;
  devise: string;
  image_url: string;
  lien: string;
  categorie: Categorie;
  couleur: Couleur | null;
  vestiaire: 'femme' | 'homme' | 'mixte';
  styles: string[];
};

// Une pièce du dressing une fois analysée (Edge Function analyser-piece). La description garde son possessif
// (« ton jean droit bleu », « ta robe noire ») pour s'afficher telle quelle dans la raison.
export type PieceAnalysee = { id: string; categorie: Categorie | null; couleur: Couleur | null; description: string | null };

export type Recommandation = { article: Article; score: number; raison: string; pieceId: string | null };

// Couleurs neutres : vont avec tout, et entre elles.
const NEUTRES: ReadonlySet<Couleur> = new Set(['noir', 'blanc', 'beige', 'gris', 'marine', 'bleu', 'marron', 'kaki']);

export function couleursVontEnsemble(a: Couleur | null, b: Couleur | null): boolean {
  if (!a || !b) return true;
  if (NEUTRES.has(a) || NEUTRES.has(b)) return true;
  // Deux couleurs vives, ou un motif avec une couleur vive : on évite.
  return false;
}

// Catégories qui forment une tenue ensemble.
const ASSOCIATIONS: Record<Categorie, readonly Categorie[]> = {
  haut: ['bas', 'veste', 'chaussures'],
  bas: ['haut', 'veste', 'chaussures'],
  robe: ['veste', 'chaussures', 'accessoire'],
  veste: ['haut', 'bas', 'robe'],
  chaussures: ['bas', 'robe'],
  accessoire: ['haut', 'robe'],
};

export function categoriesVontEnsemble(a: Categorie, b: Categorie): boolean {
  return ASSOCIATIONS[a].includes(b);
}

const NOMS_CATEGORIE: Record<Categorie, string> = {
  haut: 'haut',
  bas: 'bas',
  robe: 'robe',
  veste: 'veste',
  chaussures: 'paire de chaussures',
  accessoire: 'accessoire',
};

const ARTICLE_INDEFINI: Record<Categorie, string> = {
  haut: 'un',
  bas: 'un',
  robe: 'une',
  veste: 'une',
  chaussures: 'une',
  accessoire: 'un',
};

// Un article est proposé au bon vestiaire (et les articles mixtes à tous).
export function pourLeVestiaire(article: Article, vestiaire: Vestiaire | null): boolean {
  return !vestiaire || article.vestiaire === 'mixte' || article.vestiaire === vestiaire;
}

// Mots utiles des règles de silhouette : « jeans droits ou évasés » → [« droit », « évasé »].
export function motsDeCoupe(aPrivilegier: string[]): string[] {
  const vides = new Set(['ou', 'et', 'à', 'a', 'de', 'des', 'les', 'le', 'la', 'en', 'avec', 'sur']);
  return [
    ...new Set(
      aPrivilegier
        .flatMap((r) => r.replace(/\(.*?\)/g, '').toLowerCase().split(/[\s,/'’]+/))
        .map((m) => m.replace(/s$/, ''))
        .filter((m) => m.length >= 4 && !vides.has(m)),
    ),
  ];
}

function correspondCoupe(article: Article, mots: string[]): boolean {
  const nom = article.nom.toLowerCase();
  return mots.some((m) => nom.includes(m));
}

// Mélange les catégories pour une grille variée (pas 8 hauts d'affilée), sans changer l'ordre dans une catégorie.
export function varier<T extends { article: Article }>(liste: T[]): T[] {
  const files = new Map<Categorie, T[]>();
  for (const r of liste) files.set(r.article.categorie, [...(files.get(r.article.categorie) ?? []), r]);
  const sortie: T[] = [];
  while (sortie.length < liste.length) {
    for (const file of files.values()) {
      const r = file.shift();
      if (r) sortie.push(r);
    }
  }
  return sortie;
}

export function pourTonStyle(
  articles: Article[],
  style: Style | null,
  vestiaire: Vestiaire | null,
  aPrivilegier: string[] = [],
): Recommandation[] {
  const mots = motsDeCoupe(aPrivilegier);
  const notes = articles
    .filter((a) => pourLeVestiaire(a, vestiaire))
    .map((article) => {
      const style_ = !!style && article.styles.includes(style);
      const coupe = correspondCoupe(article, mots);
      const score = (style_ ? 3 : 0) + (coupe ? 1 : 0);
      const raison = coupe ? 'Coupe conseillée pour ta silhouette' : style_ ? 'Dans ton style' : 'À découvrir';
      return { article, score, raison, pieceId: null };
    })
    .filter((r) => !style || r.score > 0)
    .sort((a, b) => b.score - a.score);
  return varier(notes);
}

export function avecTonDressing(
  articles: Article[],
  pieces: PieceAnalysee[],
  style: Style | null,
  vestiaire: Vestiaire | null,
): Recommandation[] {
  const analysees = pieces.filter((p): p is PieceAnalysee & { categorie: Categorie } => !!p.categorie);
  if (!analysees.length) return [];
  const parCategorie = new Map<Categorie, number>();
  for (const p of analysees) parCategorie.set(p.categorie, (parCategorie.get(p.categorie) ?? 0) + 1);

  const recos: Recommandation[] = [];
  for (const article of articles) {
    if (!pourLeVestiaire(article, vestiaire)) continue;
    // Déjà dans le dressing : même catégorie et même couleur.
    if (analysees.some((p) => p.categorie === article.categorie && p.couleur && p.couleur === article.couleur)) continue;
    const partenaire = analysees.find(
      (p) => categoriesVontEnsemble(article.categorie, p.categorie) && couleursVontEnsemble(article.couleur, p.couleur),
    );
    if (!partenaire) continue;
    const manque = !parCategorie.get(article.categorie);
    const score = 2 + (manque ? 2 : 0) + (style && article.styles.includes(style) ? 1 : 0);
    const raison = manque
      ? `Il manque ${ARTICLE_INDEFINI[article.categorie]} ${NOMS_CATEGORIE[article.categorie]} à ton dressing`
      : `Va avec ${partenaire.description ?? 'une de tes pièces'}`;
    recos.push({ article, score, raison, pieceId: partenaire.id });
  }
  return varier(recos.sort((a, b) => b.score - a.score));
}

export function prixAffiche(article: Pick<Article, 'prix' | 'devise'>): string | null {
  if (article.prix === null) return null;
  const montant = article.prix.toFixed(2).replace('.', ',').replace(/,00$/, '');
  return article.devise === 'EUR' ? `${montant} €` : `${montant} ${article.devise}`;
}
