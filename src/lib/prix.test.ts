// Verrou des prix affichés : npm test.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { economieAnnuel } from './prix.ts';

test('économie de l’annuel : 59,99 € contre 9,99 € par mois → 50 %', () => {
  assert.equal(economieAnnuel(59.99, 9.99), 50);
  assert.equal(economieAnnuel(39.99, 9.99), 67);
  assert.equal(economieAnnuel(119.88, 9.99), null);
  assert.equal(economieAnnuel(0, 9.99), null);
});

test('le paywall n’affirme pas « Le plus choisi » (faux au lancement)', () => {
  const paywall = readFileSync(new URL('../app/paywall.tsx', import.meta.url), 'utf8');
  assert.equal(paywall.includes('Le plus choisi'), false);
});
