// Verrou de la mesure du parcours : npm test.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { ETAPES, GESTES } from './mesure-etapes.ts';

test('les noms d’événements de l’app sont exactement ceux autorisés par la table', () => {
  const sql = readFileSync(join(import.meta.dirname, '..', '..', 'supabase', 'migrations', '20261015000016_evenements.sql'), 'utf8');
  const bloc = sql.match(/check \(nom in \(([\s\S]*?)\)\)/)?.[1] ?? '';
  const autorises = [...bloc.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
  assert.deepEqual(autorises, [...ETAPES, ...GESTES].sort());
});
