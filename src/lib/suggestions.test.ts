// Verrou des idées de pièces : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { suggestions, touche } from './suggestions.ts';

// Règles de src/lib/morphologie.ts (silhouette A femme, silhouette H homme).
const A_FEMME = ['hauts clairs ou à motifs', 'encolures bateau ou carrées', 'jeans droits ou évasés', 'jupes trapèze'];
const H_HOMME = ['superpositions (surchemise, veste)', 'vestes structurées', 'pantalons droits', 'pulls à col'];

test('silhouette A, style chic : pièces de la règle A, mot-clé du style dans la recherche', () => {
  const s = suggestions(A_FEMME, 'chic', 'femme');
  assert.equal(s.length, 4);
  assert.equal(s[2].piece, 'Jeans droits');
  assert.equal(s[2].requete, 'jeans droits élégant femme');
  assert.ok(s[2].vinted.startsWith('https://www.vinted.fr/catalog?search_text=jeans%20droits'));
  assert.ok(s[2].google.startsWith('https://www.google.com/search?tbm=shop&q='));
});

test('les parenthèses et les « ou » des règles ne finissent pas dans la recherche', () => {
  const s = suggestions(H_HOMME, 'streetwear', 'homme');
  assert.equal(s[0].piece, 'Superpositions');
  for (const x of s) assert.doesNotMatch(x.requete, /\(| ou /);
});

test('chaque style a sa touche', () => {
  assert.match(touche('boheme'), /fluides/);
});

test('idées du dressing : une pièce qui accompagne chaque pièce reconnue, couleur facile', async () => {
  const { ideesDressing } = await import('./suggestions.ts');
  const pieces = [
    { id: '1', categorie: 'bas' as const, couleur: 'marine' as const, description: 'ton jean bleu foncé' },
    { id: '2', categorie: 'chaussures' as const, couleur: 'blanc' as const, description: 'tes baskets blanches' },
    { id: '3', categorie: null, couleur: null, description: null },
  ];
  const s = ideesDressing(pieces, 'casual', 'femme');
  assert.equal(s.length, 2);
  assert.equal(s[0].avec, 'Avec ton jean bleu foncé');
  assert.equal(s[0].piece, 'Chemise blanche');
  assert.equal(s[1].piece, 'Jean droit bleu marine');
  assert.ok(s[0].vinted.includes('chemise%20blanche%20casual%20femme'));
});
