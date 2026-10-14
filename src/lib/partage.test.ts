// Verrou du partage : npm run test:partage (Node 24, types effacés à la volée).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { estLienDePartage, etapePartage, extraireLien, lirePartage } from './partage.ts';

test('lien au milieu du texte partagé par une app de mode', () => {
  assert.equal(
    extraireLien('Regarde cet article sur Vinted : https://www.vinted.fr/items/123-robe-noire ! 😍'),
    'https://www.vinted.fr/items/123-robe-noire',
  );
  assert.equal(extraireLien('(https://www.zara.com/fr/fr/veste-p123.html).'), 'https://www.zara.com/fr/fr/veste-p123.html');
});

test('pas de lien ou lien invalide : rien', () => {
  assert.equal(extraireLien('Une jolie robe'), null);
  assert.equal(extraireLien('http://localhost/x'), null);
  assert.deepEqual(lirePartage([]), { type: 'rien' });
  assert.deepEqual(lirePartage([{ value: 'coucou', shareType: 'text' }]), { type: 'rien' });
});

test('une image partagée donne son URI (résolue en priorité)', () => {
  assert.deepEqual(lirePartage([{ value: 'file:///a.jpg', shareType: 'image', mimeType: 'image/jpeg' }]), {
    type: 'image',
    uri: 'file:///a.jpg',
  });
  assert.deepEqual(
    lirePartage([{ value: 'content://x', shareType: 'file', contentType: 'image', contentUri: 'file:///copie.png' }]),
    { type: 'image', uri: 'file:///copie.png' },
  );
});

test('image et lien partagés ensemble : l’image passe d’abord', () => {
  const partage = lirePartage([
    { value: 'https://www.zara.com/fr/p1.html', shareType: 'url' },
    { value: 'file:///capture.jpg', shareType: 'image' },
  ]);
  assert.deepEqual(partage, { type: 'image', uri: 'file:///capture.jpg' });
});

test('un lien seul (type url ou website résolu)', () => {
  assert.deepEqual(lirePartage([{ value: 'https://www.asos.com/fr/p/1', shareType: 'url', contentType: 'website' }]), {
    type: 'lien',
    url: 'https://www.asos.com/fr/p/1',
  });
});

test('seul le lien d’ouverture d’expo-sharing mène à l’écran partage', () => {
  assert.equal(estLienDePartage('akalie://expo-sharing'), true);
  assert.equal(estLienDePartage('akalie://expo-sharing?id=1'), true);
  assert.equal(estLienDePartage('akalie://vetement'), false);
  assert.equal(estLienDePartage('akalie://expo-sharing-faux'), false);
  assert.equal(estLienDePartage('/partage'), false);
});

const base = { pret: true, nbBrutes: 1, nbResolues: 0, isResolving: false, erreur: false, delaiPasse: false };

test('app déjà ouverte : on attend la résolution au lieu de traiter les charges brutes', () => {
  // Premier rendu : le hook n'a pas encore lancé la résolution (cause du NO-GO du 12 oct. 2026).
  assert.equal(etapePartage(base), 'attendre');
  assert.equal(etapePartage({ ...base, isResolving: true }), 'attendre');
  assert.equal(etapePartage({ ...base, nbResolues: 1 }), 'resolues');
});

test('repli sur les charges brutes seulement en cas d’erreur ou de délai dépassé', () => {
  assert.equal(etapePartage({ ...base, erreur: true }), 'brutes');
  assert.equal(etapePartage({ ...base, delaiPasse: true }), 'brutes');
  assert.equal(etapePartage({ ...base, isResolving: true, delaiPasse: true }), 'brutes');
});

test('session pas prête : attendre ; rien de partagé : vide', () => {
  assert.equal(etapePartage({ ...base, pret: false, nbResolues: 1 }), 'attendre');
  assert.equal(etapePartage({ ...base, nbBrutes: 0 }), 'vide');
});
