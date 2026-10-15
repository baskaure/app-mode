// Verrou des workflows GitHub (15 oct. 2026) : un « absent : rien » non cité avait rendu le YAML invalide,
// et GitHub refusait le workflow sans prévenir. npm test relit chaque fichier.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { parse } from 'yaml';

const dossier = new URL('../../.github/workflows/', import.meta.url);

test('chaque workflow GitHub est un YAML valide avec des jobs', () => {
  const fichiers = readdirSync(dossier).filter((f) => f.endsWith('.yml'));
  assert.ok(fichiers.length >= 2);
  for (const f of fichiers) {
    const doc = parse(readFileSync(new URL(f, dossier), 'utf8'));
    assert.ok(doc?.jobs && doc?.on, f);
  }
});
