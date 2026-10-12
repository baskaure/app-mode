// Verrou de l'effacement des fichiers : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { listerTout, PAGE, paquets, type Entree, type Lister } from './fichiers.ts';

// Faux stockage : un dossier = liste d'entrées ; une entrée sans id est un sous-dossier.
function fauxStockage(arbre: Record<string, Entree[]>): Lister {
  return async (dossier, offset, limite) => (arbre[dossier] ?? []).slice(offset, offset + limite);
}

test('les sous-dossiers (bucket figes : uid/essai/fichier) sont parcourus', async () => {
  const lister = fauxStockage({
    u1: [
      { name: 'photo.jpg', id: 'a' },
      { name: 'essai-1', id: null },
    ],
    'u1/essai-1': [
      { name: '123-vetement', id: 'b' },
      { name: '123-personne', id: 'c' },
    ],
  });
  assert.deepEqual((await listerTout(lister, 'u1')).sort(), [
    'u1/essai-1/123-personne',
    'u1/essai-1/123-vetement',
    'u1/photo.jpg',
  ]);
});

test('plus d’une page de fichiers : rien n’est oublié', async () => {
  const beaucoup = Array.from({ length: PAGE + 7 }, (_, i) => ({ name: `f${i}.jpg`, id: `id${i}` }));
  const chemins = await listerTout(fauxStockage({ u1: beaucoup }), 'u1');
  assert.equal(chemins.length, PAGE + 7);
});

test('dossier vide : aucun fichier', async () => {
  assert.deepEqual(await listerTout(fauxStockage({}), 'u1'), []);
});

test('paquets de 1 000 chemins au plus', () => {
  assert.deepEqual(
    paquets(Array.from({ length: 2001 }, (_, i) => i)).map((p) => p.length),
    [1000, 1000, 1],
  );
  assert.deepEqual(paquets([]), []);
});
