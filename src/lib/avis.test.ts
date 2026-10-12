// Verrou du « j'aime / j'aime pas » : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { basculerAvis, filtrerParAvis } from './avis.ts';

test('toucher deux fois le même bouton retire l’avis, l’autre bouton le remplace', () => {
  assert.equal(basculerAvis(null, 'aime'), 'aime');
  assert.equal(basculerAvis('aime', 'aime'), null);
  assert.equal(basculerAvis('aime', 'aime_pas'), 'aime_pas');
  assert.equal(basculerAvis('aime_pas', 'aime_pas'), null);
});

test('filtre « J’aime » : seulement les essais aimés', () => {
  const liste = [
    { id: 1, avis: 'aime' as const },
    { id: 2, avis: 'aime_pas' as const },
    { id: 3, avis: null },
  ];
  assert.deepEqual(filtrerParAvis(liste, 'aime').map((e) => e.id), [1]);
  assert.equal(filtrerParAvis(liste, 'tous').length, 3);
});
