// Verrou de l'appel OpenAI : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CONSIGNE_ESSAYAGE,
  depuisBase64,
  DUREE_MAX_ESSAI_MS,
  essaiAbandonne,
  estimerCoutUsd,
  lireReponse,
  TAILLE_IMAGE,
} from './openai-reponse.ts';

test('lit l’image et l’usage d’une réponse réussie', () => {
  const r = lireReponse({ data: [{ b64_json: 'QUJD' }], usage: { output_tokens: 10 } });
  assert.equal(r.base64, 'QUJD');
  assert.deepEqual(depuisBase64(r.base64), new Uint8Array([65, 66, 67]));
  assert.equal(r.usage?.output_tokens, 10);
});

test('une réponse sans image lève une erreur openai:, avec le message de l’API s’il existe', () => {
  assert.throws(() => lireReponse({ data: [] }), /^Error: openai:réponse sans image$/);
  assert.throws(() => lireReponse({ error: { message: 'moderation_blocked' } }), /openai:moderation_blocked/);
  assert.throws(() => lireReponse(null), /openai:/);
});

test('coût estimé : texte, images en entrée et image en sortie au tarif de chacun', () => {
  // 200 jetons texte à 5 $, 3 000 jetons image à 8 $, 1 000 jetons en sortie à 30 $ (par million).
  const cout = estimerCoutUsd({
    input_tokens: 3200,
    output_tokens: 1000,
    input_tokens_details: { text_tokens: 200, image_tokens: 3000 },
  });
  assert.equal(cout, 0.055);
  assert.equal(estimerCoutUsd(undefined), null);
});

test('la consigne protège le corps et la tenue non essayée', () => {
  assert.match(CONSIGNE_ESSAYAGE, /Never slim, enlarge or reshape the body/);
  assert.match(CONSIGNE_ESSAYAGE, /Never remove clothing/);
  assert.match(CONSIGNE_ESSAYAGE, /Image 1 is a photo of a real person/);
});

test('taille portrait aux côtés multiples de 16', () => {
  const [l, h] = TAILLE_IMAGE.split('x').map(Number);
  assert.ok(h > l && l % 16 === 0 && h % 16 === 0);
});

test('un essai en cours depuis trop longtemps est considéré abandonné', () => {
  const maintenant = new Date('2026-10-12T12:00:00Z');
  assert.equal(essaiAbandonne(new Date(maintenant.getTime() - DUREE_MAX_ESSAI_MS - 1).toISOString(), maintenant), true);
  assert.equal(essaiAbandonne(new Date(maintenant.getTime() - 60_000).toISOString(), maintenant), false);
  assert.equal(essaiAbandonne(null, maintenant), false);
});
