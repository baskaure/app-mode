// Verrou de l'appel Kie.ai : npm test. Formes de réponse prises dans la doc lue le 13 oct. 2026.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CONSIGNE_ESSAYAGE,
  corpsCreation,
  DUREE_MAX_ESSAI_MS,
  essaiAbandonne,
  lireCreation,
  lireTache,
  MODELE_IMAGE,
} from './kie.ts';

test('création : la personne d’abord, puis le vêtement, en 1K', () => {
  const corps = corpsCreation('https://x/personne', 'https://x/vetement');
  assert.equal(corps.model, MODELE_IMAGE);
  assert.deepEqual(corps.input.input_urls, ['https://x/personne', 'https://x/vetement']);
  assert.equal(corps.input.resolution, '1K');
});

test('création : identifiant lu, et un code ≠ 200 lève une erreur kie: même avec HTTP 200', () => {
  assert.equal(lireCreation({ code: 200, msg: 'success', data: { taskId: 'task_gptimage_1' } }), 'task_gptimage_1');
  assert.throws(() => lireCreation({ code: 401, msg: 'invalid key', data: null }), /^Error: kie:invalid key$/);
  assert.throws(() => lireCreation({ code: 402, msg: 'insufficient credits' }), /kie:insufficient credits/);
  assert.throws(() => lireCreation(null), /kie:/);
});

test('suivi : en attente, en cours de génération → en_cours', () => {
  for (const state of ['waiting', 'queuing', 'generating']) {
    assert.deepEqual(lireTache({ code: 200, data: { state } }), { etat: 'en_cours' });
  }
});

test('suivi : succès → première image de resultJson (une chaîne JSON) et crédits', () => {
  const t = lireTache({
    code: 200,
    data: { state: 'success', resultJson: '{"resultUrls":["https://k/1.png"]}', creditsConsumed: 3 },
  });
  assert.deepEqual(t, { etat: 'fait', url: 'https://k/1.png', credits: 3 });
});

test('suivi : échec avec sa raison ; succès sans image = échec', () => {
  assert.deepEqual(
    lireTache({ code: 200, data: { state: 'fail', failCode: '500', failMsg: 'moderation', creditsConsumed: 0 } }),
    { etat: 'echec', raison: '500 : moderation', credits: 0 },
  );
  assert.equal(lireTache({ code: 200, data: { state: 'success', resultJson: 'pas du json' } }).etat, 'echec');
});

test('la consigne sait essayer des chaussures sans toucher au reste', () => {
  assert.match(CONSIGNE_ESSAYAGE, /one pair of shoes/);
  assert.match(CONSIGNE_ESSAYAGE, /shoes replace only the shoes/);
});

test('la consigne protège le corps et la tenue non essayée', () => {
  assert.match(CONSIGNE_ESSAYAGE, /Never slim, enlarge or reshape the body/);
  assert.match(CONSIGNE_ESSAYAGE, /Never remove clothing/);
});

test('un essai en cours depuis trop longtemps est considéré abandonné', () => {
  const maintenant = new Date('2026-10-13T12:00:00Z');
  assert.equal(essaiAbandonne(new Date(maintenant.getTime() - DUREE_MAX_ESSAI_MS - 1).toISOString(), maintenant), true);
  assert.equal(essaiAbandonne(new Date(maintenant.getTime() - 60_000).toISOString(), maintenant), false);
  assert.equal(essaiAbandonne(null, maintenant), false);
});
