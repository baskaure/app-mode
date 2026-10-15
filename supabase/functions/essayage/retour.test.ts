// Verrou de la fin d'essayage sans l'app : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { jetonRetour, memeJeton, messagesPush } from './retour.ts';

test('jeton de retour : stable pour un essai, différent pour un autre ou une autre clé', async () => {
  const a = await jetonRetour('essai-1', 'cle');
  assert.equal(a.length, 64);
  assert.equal(a, await jetonRetour('essai-1', 'cle'));
  assert.notEqual(a, await jetonRetour('essai-2', 'cle'));
  assert.notEqual(a, await jetonRetour('essai-1', 'autre'));
  assert.ok(memeJeton(a, a));
  assert.ok(!memeJeton(a, a.slice(0, 63) + '0') || a.endsWith('0'));
  assert.ok(!memeJeton(a, 'court'));
});

test('notification : une par appareil, l’essai dans les données', () => {
  const m = messagesPush(['ExponentPushToken[a]', 'ExponentPushToken[b]'], 'e1', 'fait');
  assert.equal(m.length, 2);
  assert.equal(m[0].title, 'Ton essayage est prêt');
  assert.deepEqual(m[1].data, { essai: 'e1' });
  assert.match(messagesPush(['x'], 'e1', 'erreur')[0].title, /pas abouti/);
});
