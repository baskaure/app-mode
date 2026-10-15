// Verrou de la formule affichée : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lirePlan, textePlan } from './plan.ts';

test('formule lue dans le produit RevenueCat, texte avec l’échéance', () => {
  assert.equal(lirePlan(undefined), null);
  const p = lirePlan({
    productIdentifier: 'akalie_premium_annuel',
    expirationDate: '2027-10-15T15:50:00Z',
    willRenew: true,
  });
  assert.equal(p?.formule, 'Annuel');
  assert.equal(textePlan(p!), 'Annuel · renouvelé le 15 octobre 2027');
  const m = lirePlan({
    productIdentifier: 'akalie_premium_mensuel',
    expirationDate: '2026-11-15T10:00:00Z',
    willRenew: false,
  });
  assert.equal(textePlan(m!), 'Mensuel · se termine le 15 novembre 2026');
});
