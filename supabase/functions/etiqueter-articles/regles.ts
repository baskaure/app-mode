// Partie pure de l'étiquetage des articles (sans réseau ni Deno) : consigne, schéma, contrôle de la réponse.
// Testé par regles.test.ts (npm test).

export const CATEGORIES = ['haut', 'bas', 'robe', 'veste', 'chaussures', 'accessoire'] as const;
export const COULEURS = [
  'noir', 'blanc', 'beige', 'gris', 'marine', 'bleu', 'marron', 'kaki', 'vert',
  'rouge', 'rose', 'jaune', 'violet', 'orange', 'motif',
] as const;
export const COUPES = ['droit', 'large', 'slim', 'evase', 'oversize', 'cintre', 'ample', 'court', 'long'] as const;

export type Entree = { id: string; nom: string; marchand: string; categorie: string; vestiaire: string };
export type Etiquette = {
  id: string;
  garder: boolean;
  nom_court: string;
  categorie: (typeof CATEGORIES)[number];
  couleur: (typeof COULEURS)[number] | null;
  coupe: (typeof COUPES)[number] | null;
};

export const CONSIGNE = `Tu tries des articles de mode trouvés sur Google Shopping pour une app française d'essayage virtuel (adultes, 15 ans et plus).
Pour chaque article (id, titre du marchand, marchand, catégorie supposée, vestiaire), réponds :
- garder : false si ce n'est pas un vêtement ou des chaussures pour adulte portables au quotidien (enfant, bébé, déguisement, costume de scène, lingerie, maillot de bain, équipement de sécurité ou de sport technique, objet, affiche, accessoire maison), ou si le titre est trop vague pour savoir ce que c'est. Sinon true.
- nom_court : le nom de l'article en français, 2 à 5 mots, sans la marque, sans « femme »/« homme », sans taille ni mot marketing (élégant, tendance, chic, slim fit…). Forme : type + détail principal + couleur. Exemples : « Blazer cintré noir », « Jean large bleu clair », « Robe longue fleurie », « Baskets basses blanches ».
- categorie : haut, bas, robe, veste, chaussures ou accessoire (corrige la catégorie supposée si elle est fausse).
- couleur : la couleur principale parmi la liste, « motif » si imprimé, « inconnue » si le titre ne la donne pas.
- coupe : droit, large, slim, evase, oversize, cintre, ample, court ou long si le titre l'indique, sinon « aucune ».
Ne jamais inventer : si une information manque dans le titre, choisis « inconnue » ou « aucune ».`;

export const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['articles'],
  properties: {
    articles: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'garder', 'nom_court', 'categorie', 'couleur', 'coupe'],
        properties: {
          id: { type: 'string' },
          garder: { type: 'boolean' },
          nom_court: { type: 'string' },
          categorie: { type: 'string', enum: [...CATEGORIES] },
          couleur: { type: 'string', enum: [...COULEURS, 'inconnue'] },
          coupe: { type: 'string', enum: [...COUPES, 'aucune'] },
        },
      },
    },
  },
} as const;

// Texte envoyé à l'IA : une ligne par article, sans donnée d'utilisateur.
export function lignes(entrees: Entree[]): string {
  return entrees.map((e) => JSON.stringify({ id: e.id, titre: e.nom, marchand: e.marchand, categorie: e.categorie, vestiaire: e.vestiaire })).join('\n');
}

// Garde seulement les étiquettes valides dont l'id a bien été demandé ; nom_court nettoyé et borné.
export function controler(reponse: unknown, demandes: Entree[]): Etiquette[] {
  const ids = new Set(demandes.map((d) => d.id));
  const liste = (reponse as { articles?: unknown })?.articles;
  if (!Array.isArray(liste)) return [];
  const sortie: Etiquette[] = [];
  for (const brut of liste) {
    const e = brut as Partial<Etiquette>;
    if (typeof e.id !== 'string' || !ids.has(e.id) || typeof e.garder !== 'boolean') continue;
    if (!CATEGORIES.includes(e.categorie as Etiquette['categorie'])) continue;
    const nom = typeof e.nom_court === 'string' ? e.nom_court.replace(/\s+/g, ' ').trim().slice(0, 60) : '';
    if (e.garder && !nom) continue;
    sortie.push({
      id: e.id,
      garder: e.garder,
      nom_court: nom ? nom.charAt(0).toUpperCase() + nom.slice(1) : '',
      categorie: e.categorie as Etiquette['categorie'],
      couleur: COULEURS.includes(e.couleur as never) ? (e.couleur as Etiquette['couleur']) : null,
      coupe: COUPES.includes(e.coupe as never) ? (e.coupe as Etiquette['coupe']) : null,
    });
  }
  return sortie;
}
