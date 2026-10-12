// Règles du filtre, sans dépendance : testées par regles.test.ts (npm run test:filtre).

export const CATEGORIES_AUTORISEES = [
  'haut',
  'bas',
  'robe_jupe',
  'combinaison',
  'veste_manteau',
  'tenue_de_sport_couvrante',
] as const;
export const CATEGORIES_REFUSEES = ['lingerie_sous_vetement', 'maillot_de_bain', 'transparent', 'pas_un_vetement'] as const;

export type Verdict = {
  vetement_categorie: (typeof CATEGORIES_AUTORISEES)[number] | (typeof CATEGORIES_REFUSEES)[number];
  vetement_autorise: boolean;
  personne_autorisee: boolean;
};

export type Decision = { autorise: true } | { autorise: false; message: string };

export const MESSAGES = {
  lingerie: 'Ce vêtement ne peut pas être essayé : la lingerie, les maillots de bain et les vêtements transparents sont exclus.',
  pas_un_vetement: 'On ne voit pas de vêtement sur cette image. Essaie une autre photo de l’article.',
  personne: 'Ta photo de toi doit te montrer en tenue de tous les jours. Change-la dans ton profil, puis réessaie.',
  refus_ia: 'Cette image ne peut pas être utilisée pour un essayage.',
} as const;

// Décision prise par le code, pas par le modèle seul : les trois signaux doivent être au vert.
export function decider(verdict: Verdict | null): Decision {
  if (!verdict) return { autorise: false, message: MESSAGES.refus_ia };
  if (verdict.personne_autorisee !== true) return { autorise: false, message: MESSAGES.personne };
  if (verdict.vetement_categorie === 'pas_un_vetement') return { autorise: false, message: MESSAGES.pas_un_vetement };
  const categorieOk = (CATEGORIES_AUTORISEES as readonly string[]).includes(verdict.vetement_categorie);
  if (!categorieOk || verdict.vetement_autorise !== true) return { autorise: false, message: MESSAGES.lingerie };
  return { autorise: true };
}

export const SCHEMA = {
  type: 'object',
  properties: {
    vetement_categorie: { type: 'string', enum: [...CATEGORIES_AUTORISEES, ...CATEGORIES_REFUSEES] },
    vetement_autorise: { type: 'boolean' },
    personne_autorisee: { type: 'boolean' },
  },
  required: ['vetement_categorie', 'vetement_autorise', 'personne_autorisee'],
  additionalProperties: false,
};

export const CONSIGNE = `Tu contrôles les images d'une app d'essayage virtuel de vêtements, avant qu'une IA habille la personne.

Image 1 : le vêtement à essayer (photo produit, capture d'écran d'un site, ou photo prise en magasin ; il peut être porté par un mannequin).
Image 2 : la photo de la personne qui va l'essayer.

Pour l'image 1, choisis la catégorie du vêtement principal :
- haut, bas, robe_jupe, combinaison, veste_manteau, tenue_de_sport_couvrante : vêtements de tous les jours ;
- lingerie_sous_vetement : soutien-gorge, culotte, string, caleçon, boxer, body ou nuisette de lingerie, bas résille, déshabillé ;
- maillot_de_bain : maillot une pièce, bikini, slip ou short de bain ;
- transparent : vêtement en voile, résille ou dentelle qui laisserait voir les seins, les fesses ou les parties intimes ;
- pas_un_vetement : aucun vêtement identifiable, ou image sans rapport.
Un crop top, un débardeur ou une brassière de sport portée comme haut de sport restent autorisés.
vetement_autorise = false si la catégorie est lingerie_sous_vetement, maillot_de_bain, transparent ou pas_un_vetement, ou si l'image est sexualisée.

Pour l'image 2 : personne_autorisee = false si la personne est nue, seulement en sous-vêtements ou en maillot, dans une pose sexualisée, ou semble être un enfant. Des vêtements près du corps (legging, t-shirt moulant) sont normaux et autorisés.

En cas de doute, réponds false.`;
