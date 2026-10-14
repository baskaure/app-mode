// Règles du filtre, sans dépendance : testées par regles.test.ts (npm run test:filtre).

export const CATEGORIES_AUTORISEES = [
  'haut',
  'bas',
  'robe_jupe',
  'combinaison',
  'veste_manteau',
  'tenue_de_sport_couvrante',
  // Ajouté le 15 oct. 2026 : sans cette catégorie, une paire de chaussures était classée « pas_un_vetement ».
  'chaussures',
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
- chaussures : baskets, bottes, bottines, escarpins, sandales, mocassins, derbies, portées ou seules ;
- lingerie_sous_vetement : soutien-gorge, culotte, string, caleçon, boxer, body ou nuisette de lingerie, bas résille, déshabillé ;
- maillot_de_bain : maillot une pièce, bikini, slip ou short de bain ;
- transparent : vêtement en voile, résille ou dentelle qui laisserait voir les seins, les fesses ou les parties intimes ;
- pas_un_vetement : aucun vêtement identifiable, ou image sans rapport.
Un crop top, un débardeur ou une brassière de sport portée comme haut de sport restent autorisés.
vetement_autorise = false si la catégorie est lingerie_sous_vetement, maillot_de_bain, transparent ou pas_un_vetement, ou si l'image est sexualisée.

Pour l'image 2 : personne_autorisee = false si la personne est nue, seulement en sous-vêtements ou en maillot, dans une pose sexualisée, ou semble être un enfant. Des vêtements près du corps (legging, t-shirt moulant) sont normaux et autorisés.

En cas de doute, réponds false.`;

// --- Vérification de l'image PRODUITE (après la génération, avant de l'enregistrer et de l'afficher) ---
// Le 12 oct. 2026, Kling a retiré une robe et rendu un buste nu flouté : le filtre d'entrée ne suffit pas.

export type VerdictResultat = {
  personne_habillee: boolean;
  nudite_ou_sous_vetements: boolean;
  zone_floutee_sur_le_corps: boolean;
};

export const MESSAGE_RESULTAT_REFUSE =
  'L’image produite n’a pas passé notre vérification, elle ne sera pas affichée. Réessaie avec une photo de toi en haut et bas séparés.';

// Les trois signaux doivent être nets ; un booléen mal formé ou une réponse absente bloque.
export function deciderResultat(verdict: VerdictResultat | null): boolean {
  if (!verdict) return false;
  return (
    verdict.personne_habillee === true &&
    verdict.nudite_ou_sous_vetements === false &&
    verdict.zone_floutee_sur_le_corps === false
  );
}

export const SCHEMA_RESULTAT = {
  type: 'object',
  properties: {
    personne_habillee: { type: 'boolean' },
    nudite_ou_sous_vetements: { type: 'boolean' },
    zone_floutee_sur_le_corps: { type: 'boolean' },
  },
  required: ['personne_habillee', 'nudite_ou_sous_vetements', 'zone_floutee_sur_le_corps'],
  additionalProperties: false,
};

export const CONSIGNE_RESULTAT = `Tu contrôles une image créée par une IA d'essayage virtuel, avant de la montrer à l'utilisateur.

- personne_habillee = true seulement si la personne porte une tenue ordinaire complète (haut ET bas, ou une robe).
- nudite_ou_sous_vetements = true si on voit un torse ou une poitrine nus, des fesses, des parties intimes, ou une personne seulement en sous-vêtements ou en maillot.
- zone_floutee_sur_le_corps = true si une partie du corps est floutée, pixelisée ou masquée (signe qu'une nudité a été censurée), même si le reste paraît normal.

En cas de doute, réponds dans le sens de la prudence (personne_habillee = false, ou l'un des deux autres à true).`;
