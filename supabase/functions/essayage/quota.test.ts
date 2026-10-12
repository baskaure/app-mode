// Verrou du quota d'essayages : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { droitActif, verifierQuota } from './quota.ts';

const maintenant = new Date('2026-10-12T12:00:00Z');

test('droit RevenueCat : actif, expiré, à vie, délai de grâce', () => {
  assert.equal(droitActif({ expires_date: '2026-11-12T12:00:00Z' }, maintenant), true);
  assert.equal(droitActif({ expires_date: '2026-10-01T12:00:00Z' }, maintenant), false);
  assert.equal(droitActif({ expires_date: null }, maintenant), true);
  assert.equal(
    droitActif({ expires_date: '2026-10-01T12:00:00Z', grace_period_expires_date: '2026-10-20T00:00:00Z' }, maintenant),
    true,
  );
  assert.equal(droitActif(undefined, maintenant), false);
  assert.equal(droitActif({ expires_date: 'pas une date' }, maintenant), false);
});

test('réponse RevenueCat mal formée : jamais abonné', () => {
  for (const valeur of [{}, 'oui', [], true, 1, null, { grace_period_expires_date: '2027-01-01T00:00:00Z' }]) {
    assert.equal(droitActif(valeur, maintenant), false, JSON.stringify(valeur));
  }
});

const base = {
  abonne: false,
  ceMois: 0,
  total: 0,
  maxParMois: 30,
  gratuits: 1,
  offertsAujourdhui: 0,
  maxOffertsJour: 50,
  inclus: false,
};

test('sans abonnement : 1 essayage offert, puis le paywall', () => {
  assert.deepEqual(verifierQuota(base), { ok: true });
  assert.deepEqual(verifierQuota({ ...base, total: 1, ceMois: 1 }), { ok: false, code: 'abonnement' });
  // 2e contrôle après réservation : la ligne de l'essai en cours est déjà dans le total.
  assert.deepEqual(verifierQuota({ ...base, total: 1, inclus: true }), { ok: true });
  assert.deepEqual(verifierQuota({ ...base, total: 2, inclus: true }), { ok: false, code: 'abonnement' });
});

test('abonné : jusqu’au plafond mensuel, pas au-delà', () => {
  const abonne = { ...base, abonne: true, total: 200 };
  assert.deepEqual(verifierQuota({ ...abonne, ceMois: 29 }), { ok: true });
  assert.deepEqual(verifierQuota({ ...abonne, ceMois: 30 }), { ok: false, code: 'plafond' });
  assert.deepEqual(verifierQuota({ ...abonne, ceMois: 30, inclus: true }), { ok: true });
  assert.deepEqual(verifierQuota({ ...abonne, ceMois: 31, inclus: true }), { ok: false, code: 'plafond' });
});

test('essayages offerts plafonnés par jour, tous comptes confondus (comptes anonymes recréés)', () => {
  assert.deepEqual(verifierQuota({ ...base, offertsAujourdhui: 49 }), { ok: true });
  assert.deepEqual(verifierQuota({ ...base, offertsAujourdhui: 50 }), { ok: false, code: 'offerts_du_jour' });
  assert.deepEqual(verifierQuota({ ...base, total: 1, offertsAujourdhui: 50, inclus: true }), { ok: true });
  assert.deepEqual(verifierQuota({ ...base, total: 1, offertsAujourdhui: 51, inclus: true }), {
    ok: false,
    code: 'offerts_du_jour',
  });
  // Un abonné n'est pas concerné par ce plafond.
  assert.deepEqual(verifierQuota({ ...base, abonne: true, offertsAujourdhui: 500 }), { ok: true });
});
