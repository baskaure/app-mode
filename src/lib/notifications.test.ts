// Verrou : la version web du module de notifications exporte les mêmes fonctions que la version téléphone
// (sinon le web plante ou casse à la compilation). npm test.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const exports = (fichier: string) =>
  [...readFileSync(new URL(fichier, import.meta.url), 'utf8').matchAll(/export (?:async )?function (\w+)/g)]
    .map((m) => m[1])
    .sort();

test('notifications.web.ts et notifications.ts exportent les mêmes fonctions', () => {
  assert.deepEqual(exports('./notifications.web.ts'), exports('./notifications.ts'));
});
