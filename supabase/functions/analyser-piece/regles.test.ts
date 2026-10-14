// Verrou de l'analyse des pièces : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { normaliser } from './regles.ts';

test('une pièce reconnue est gardée telle quelle, description en minuscules', () => {
  assert.deepEqual(
    normaliser({ est_vetement: true, categorie: 'bas', couleur: 'bleu', description: 'Ton  jean droit bleu' }),
    { categorie: 'bas', couleur: 'bleu', description: 'ton jean droit bleu' },
  );
});

test('pas un vêtement, ou rien de lisible : rien n’est enregistré', () => {
  const vide = { categorie: null, couleur: null, description: null };
  assert.deepEqual(normaliser(null), vide);
  assert.deepEqual(normaliser({ est_vetement: false, categorie: 'haut', couleur: 'noir', description: 'ton chat' }), vide);
});

test('valeurs hors liste ou description sans possessif : écartées', () => {
  // @ts-expect-error valeur hors liste, comme un modèle qui dérape
  const r = normaliser({ est_vetement: true, categorie: 'haut', couleur: 'fuchsia', description: 'un top' });
  assert.deepEqual(r, { categorie: 'haut', couleur: null, description: null });
  // @ts-expect-error catégorie hors liste
  assert.equal(normaliser({ est_vetement: true, categorie: 'chaussette', couleur: 'noir', description: 'tes chaussettes' }).categorie, null);
});
