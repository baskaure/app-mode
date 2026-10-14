// Verrou du lien d'achat affilié : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { hoteDe, lienAchat, trouverMarchand, type Marchand } from './affiliation.ts';

const marchands: Marchand[] = [{ domaine: 'laredoute.fr', reseau: 'awin', id_annonceur: '1234' }];
const article = 'https://www.laredoute.fr/ppdp/prod-1.aspx?coul=noir&taille=38#avis';

test('hôte : minuscules, sans www, adresses invalides refusées', () => {
  assert.equal(hoteDe('https://WWW.LaRedoute.fr/x'), 'laredoute.fr');
  assert.equal(hoteDe('http://m.zara.com:443/fr'), 'm.zara.com');
  assert.equal(hoteDe('javascript:alert(1)'), null);
  assert.equal(hoteDe('https://localhost/x'), null);
  assert.equal(hoteDe('https://user@evil.com/x'), null);
  // Un navigateur va sur evil.com : ne jamais y voir le marchand.
  assert.equal(hoteDe('https://evil.com\\.laredoute.fr/x'), null);
  assert.equal(hoteDe('https://www.laredoute.fr/a\\b'), null);
});

test('sous-domaine accepté, faux domaine qui finit pareil refusé', () => {
  assert.equal(trouverMarchand('m.laredoute.fr', marchands)?.id_annonceur, '1234');
  assert.equal(trouverMarchand('fauxlaredoute.fr', marchands), null);
});

test('marchand affilié : lien Awin au format officiel, destination encodée une seule fois', () => {
  const lien = lienAchat(article, marchands, '9999');
  assert.equal(lien?.affilie, true);
  assert.equal(
    lien?.url,
    `https://www.awin1.com/cread.php?awinmid=1234&awinaffid=9999&ued=${encodeURIComponent(article)}`,
  );
  assert.equal(decodeURIComponent(lien!.url.split('ued=')[1]), article);
});

test('marchand non affilié, ou pas d’identifiant éditeur : on ouvre l’article tel quel', () => {
  assert.deepEqual(lienAchat('https://www.zara.com/fr/p1.html', marchands, '9999'), {
    url: 'https://www.zara.com/fr/p1.html',
    affilie: false,
  });
  assert.deepEqual(lienAchat(article, marchands, undefined), { url: article, affilie: false });
});

test('pas de lien d’article (photo, capture) : pas de bouton', () => {
  assert.equal(lienAchat(null, marchands, '9999'), null);
  assert.equal(lienAchat('pas une adresse', marchands, '9999'), null);
});

test('un lien Awin du catalogue est déjà affilié : ouvert tel quel', () => {
  const lien = 'https://www.awin1.com/pclick.php?p=123&a=456&m=789';
  assert.deepEqual(lienAchat(lien, [], undefined), { url: lien, affilie: true });
});
