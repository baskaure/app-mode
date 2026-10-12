// Verrou du suivi Kling : npm test. Réponse réelle du 12 oct. 2026 (une tâche → `data` est un objet).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { imageDeSortie, lireTache } from './kling-suivi.ts';

const reelle = {
  id: '938712595836985365',
  external_id: 'banc-P3.jpg-G1.jpg-1791835041809',
  status: 'succeed',
  outputs: [{ type: 'image', url: 'https://s16-kling-fdl.klingai.com/x.png' }],
  billing: [{ charge_type: 'unit', amount: '32', package_type: 'image' }],
};

test('une tâche : Kling renvoie un objet, pas une liste (cause du bug « toujours en cours »)', () => {
  const tache = lireTache(reelle, '938712595836985365');
  assert.equal(tache?.status, 'succeed');
  assert.equal(imageDeSortie(tache!), 'https://s16-kling-fdl.klingai.com/x.png');
});

test('forme liste de la doc : la bonne tâche est retrouvée par son id', () => {
  const autre = { ...reelle, id: '1', status: 'processing' };
  assert.equal(lireTache([autre, reelle], '938712595836985365')?.status, 'succeed');
});

test('réponse vide ou autre tâche : rien (reste « en cours »)', () => {
  assert.equal(lireTache([], 'x'), null);
  assert.equal(lireTache(null, 'x'), null);
  assert.equal(lireTache({ ...reelle, id: 'autre' }, '938712595836985365'), null);
  assert.equal(lireTache({ pas_de_statut: true }, 'x'), null);
});

test('pas d’image en sortie : null', () => {
  assert.equal(imageDeSortie({ status: 'succeed', outputs: [] }), null);
  assert.equal(imageDeSortie({ status: 'succeed' }), null);
});
