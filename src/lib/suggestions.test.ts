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
