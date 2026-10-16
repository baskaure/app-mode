// Verrou des recommandations du catalogue : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  avecTonDressing,
  couleursVontEnsemble,
  motsDeCoupe,
  nomAffiche,
  pourTonStyle,
  prixAffiche,
  varier,
  type Article,
  type PieceAnalysee,
} from './catalogue-regles.ts';

let n = 0;
function article(partiel: Partial<Article>): Article {
  n += 1;
  return {
    id: `a${n}`,
    source: 'test',
    marchand: 'Marque',
    marque: 'Marque',
    nom: 'Article',
    prix: 29.99,
    devise: 'EUR',
    image_url: 'https://exemple.fr/a.jpg',
    lien: 'https://exemple.fr/a',
    categorie: 'haut',
    couleur: 'blanc',
    vestiaire: 'femme',
    styles: ['casual'],
    ...partiel,
  };
}

test('pour ton style : seulement le bon vestiaire et le style choisi, coupe conseillée en tête', () => {
  const homme = article({ vestiaire: 'homme', styles: ['chic'] });
  const autreStyle = article({ styles: ['streetwear'] });
  const chic = article({ styles: ['chic'], nom: 'Chemise en satin' });
  const chicCoupe = article({ styles: ['chic'], categorie: 'bas', nom: 'Jean droit taille haute' });
  const mixte = article({ vestiaire: 'mixte', styles: ['chic'], categorie: 'chaussures' });
  const r = pourTonStyle([homme, autreStyle, chic, chicCoupe, mixte], 'chic', 'femme', ['jeans droits ou évasés']);
  const ids = r.map((x) => x.article.id);
  assert.ok(!ids.includes(homme.id));
  assert.ok(!ids.includes(autreStyle.id));
  assert.equal(ids.length, 3);
  assert.equal(r[0].article.id, chicCoupe.id);
  assert.equal(r[0].raison, 'Coupe conseillée pour ta silhouette');
});

test('mots de coupe : « jeans droits ou évasés » donne droit et évasé', () => {
  const mots = motsDeCoupe(['jeans droits ou évasés', 'encolures bateau ou carrées']);
  assert.ok(mots.includes('droit'));
  assert.ok(mots.includes('évasé'));
  assert.ok(mots.includes('bateau'));
  assert.ok(!mots.includes('ou'));
});

test('couleurs : les neutres vont avec tout, deux couleurs vives non', () => {
  assert.equal(couleursVontEnsemble('noir', 'rouge'), true);
  assert.equal(couleursVontEnsemble('beige', 'motif'), true);
  assert.equal(couleursVontEnsemble('rouge', 'vert'), false);
  assert.equal(couleursVontEnsemble(null, 'rouge'), true);
});

test('avec ton dressing : propose ce qui va avec, ce qui manque en tête, jamais un doublon', () => {
  const pieces: PieceAnalysee[] = [
    { id: 'p1', categorie: 'haut', couleur: 'blanc', description: 'ton t-shirt blanc' },
    { id: 'p2', categorie: 'haut', couleur: 'rouge', description: 'ton pull rouge' },
  ];
  const doublon = article({ categorie: 'haut', couleur: 'blanc' });
  const bas = article({ categorie: 'bas', couleur: 'bleu', nom: 'Jean' });
  const veste = article({ categorie: 'veste', couleur: 'vert', nom: 'Veste verte' });
  const r = avecTonDressing([doublon, bas, veste], pieces, 'casual', 'femme');
  const ids = r.map((x) => x.article.id);
  assert.ok(!ids.includes(doublon.id));
  assert.equal(r[0].raison, 'Il manque un bas à ton dressing');
  // La veste verte ne va pas avec le pull rouge, mais va avec le t-shirt blanc.
  const rVeste = r.find((x) => x.article.id === veste.id);
  assert.equal(rVeste?.pieceId, 'p1');
});

test('avec ton dressing : rien tant qu’aucune pièce n’est analysée', () => {
  const pieces: PieceAnalysee[] = [{ id: 'p1', categorie: null, couleur: null, description: null }];
  assert.deepEqual(avecTonDressing([article({ categorie: 'bas' })], pieces, 'casual', 'femme'), []);
});

test('varier : alterne les catégories sans perdre d’article', () => {
  const liste = [
    article({ categorie: 'haut' }),
    article({ categorie: 'haut' }),
    article({ categorie: 'bas' }),
  ].map((a) => ({ article: a }));
  const sortie = varier(liste);
  assert.equal(sortie.length, 3);
  assert.deepEqual(
    sortie.map((x) => x.article.categorie),
    ['haut', 'bas', 'haut'],
  );
});

test('prix affiché à la française', () => {
  assert.equal(prixAffiche({ prix: 29.99, devise: 'EUR' }), '29,99 €');
  assert.equal(prixAffiche({ prix: 40, devise: 'EUR' }), '40 €');
  assert.equal(prixAffiche({ prix: null, devise: 'EUR' }), null);
});

test('coupe reconnue par l’IA, sans tenir compte des accents ; pas de raison pour le seul style', () => {
  const evase = article({ styles: ['chic'], categorie: 'bas', nom: 'PANTALON FEMME TENDANCE', coupe: 'evase' });
  const simple = article({ styles: ['chic'], nom: 'Chemise en satin' });
  const r = pourTonStyle([simple, evase], 'chic', 'femme', ['pantalons évasés']);
  assert.equal(r[0].article.id, evase.id);
  assert.equal(r[0].raison, 'Coupe conseillée pour ta silhouette');
  assert.equal(r.find((x) => x.article.id === simple.id)?.raison, '');
});

test('nom affiché : le nom court de l’IA, sinon le titre du marchand', () => {
  assert.equal(nomAffiche({ nom: 'LIAOPUFUS Femme Blazer Slim Fit', nom_court: 'Blazer cintré noir' }), 'Blazer cintré noir');
  assert.equal(nomAffiche({ nom: 'Jean droit', nom_court: null }), 'Jean droit');
});
