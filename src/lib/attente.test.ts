// Verrou de l'attente d'un essayage : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { messagesAttente, progression, tempsRestant } from './attente.ts';

test('la barre avance avec le temps, sans jamais atteindre 100 % avant l’image', () => {
  assert.equal(progression(0), 0);
  assert.ok(progression(57_500) > 0.4 && progression(57_500) < 0.45);
  assert.ok(progression(115_000) >= 0.85);
  assert.ok(progression(10 * 60_000) <= 0.95);
  assert.ok(progression(200_000) > progression(150_000));
});

test('temps restant lisible', () => {
  assert.equal(tempsRestant(0), 'Encore environ 1 min 30');
  assert.equal(tempsRestant(70_000), 'Encore environ 50 s');
  assert.equal(tempsRestant(110_000), 'Presque fini…');
  assert.equal(tempsRestant(300_000), 'Presque fini…');
});

test('les conseils de la silhouette passent avant les astuces', () => {
  const m = messagesAttente('Équilibrer le haut et le bas.', ['jeans droits ou évasés']);
  assert.equal(m[0], 'Équilibrer le haut et le bas.');
  assert.equal(m[1], 'À privilégier pour toi : jeans droits ou évasés.');
  assert.equal(m.length, 4);
});
