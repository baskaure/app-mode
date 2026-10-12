// Verrou du CAPTCHA : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lireMessageCaptcha, pageCaptcha } from './captcha.ts';

test('message de la WebView : jeton, erreur, ou réponse illisible', () => {
  assert.deepEqual(lireMessageCaptcha('{"jeton":"XXXX.DUMMY.TOKEN.XXXX"}'), { jeton: 'XXXX.DUMMY.TOKEN.XXXX' });
  assert.deepEqual(lireMessageCaptcha('{"erreur":"turnstile 600010"}'), { erreur: 'turnstile 600010' });
  assert.deepEqual(lireMessageCaptcha('{"jeton":""}'), { erreur: 'réponse inconnue' });
  assert.deepEqual(lireMessageCaptcha('{"jeton":42}'), { erreur: 'réponse inconnue' });
  assert.deepEqual(lireMessageCaptcha('pas du json'), { erreur: 'réponse illisible' });
});

test('la page du widget échappe la clé du site (pas d’injection de script)', () => {
  const page = pageCaptcha('1x00000000000000000000AA"};alert(1);//');
  assert.ok(page.includes('sitekey:"1x00000000000000000000AA\\"};alert(1);//"'));
  assert.ok(page.includes("appearance:'interaction-only'"));
});
