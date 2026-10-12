// Verrou de l'historique : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dateCourte, fichiersDeLEssai, libelleStatut, supprimable, type LigneEssai } from './historique-regles.ts';

const essai: LigneEssai = {
  id: 'e1',
  statut: 'fait',
  vetement_bucket: 'vetements',
  vetement_path: 'u1/vetement.jpg',
  resultat_path: 'u1/e1.jpg',
  created_at: '2026-10-12T10:00:00Z',
  avis: null,
};

test('supprimer un essai efface son résultat et la photo du vêtement', () => {
  assert.deepEqual(fichiersDeLEssai(essai), [
    { bucket: 'essayages', chemin: 'u1/e1.jpg' },
    { bucket: 'vetements', chemin: 'u1/vetement.jpg' },
  ]);
});

test('une pièce du dressing n’est pas effacée avec l’essai', () => {
  assert.deepEqual(fichiersDeLEssai({ ...essai, vetement_bucket: 'pieces', vetement_path: 'u1/piece.jpg' }), [
    { bucket: 'essayages', chemin: 'u1/e1.jpg' },
  ]);
  assert.deepEqual(fichiersDeLEssai({ ...essai, vetement_bucket: 'pieces', resultat_path: null }), []);
});

test('un essai en cours ne se supprime pas', () => {
  assert.equal(supprimable({ statut: 'en_cours' }), false);
  for (const statut of ['a_faire', 'fait', 'refuse', 'erreur'] as const) assert.equal(supprimable({ statut }), true);
});

test('libellés et dates courtes', () => {
  assert.equal(libelleStatut('fait'), 'Essayé');
  assert.equal(libelleStatut('a_faire'), 'Pas encore essayé');
  const maintenant = new Date(2026, 9, 12, 15, 0);
  assert.equal(dateCourte(new Date(2026, 9, 12, 8, 0).toISOString(), maintenant), 'Aujourd’hui');
  assert.equal(dateCourte(new Date(2026, 9, 11, 23, 0).toISOString(), maintenant), 'Hier');
  assert.equal(dateCourte(new Date(2026, 8, 3, 12, 0).toISOString(), maintenant), '3 sept.');
  assert.equal(dateCourte(new Date(2025, 11, 25, 12, 0).toISOString(), maintenant), '25 déc. 2025');
});
