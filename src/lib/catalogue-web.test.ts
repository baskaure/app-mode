// Verrou du catalogue « Trouvé sur le web » : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { couleurDuTitre, marchandAccepte, nettoyerTitre, PRIX_MAX, requetesCatalogue, versArticle } from './catalogue-web.ts';

test('54 recherches génériques, sans donnée personnelle', () => {
  const r = requetesCatalogue();
  assert.equal(r.length, 54);
  assert.ok(r.some((x) => x.requete === 'robe bohème femme' && x.categorie === 'robe'));
  assert.ok(!r.some((x) => x.vestiaire === 'homme' && x.categorie === 'robe'));
});

test('couleur lue dans le titre', () => {
  assert.equal(couleurDuTitre('Robe longue noire en satin'), 'noir');
  assert.equal(couleurDuTitre('Pantalon bleu marine coupe droite'), 'marine');
  assert.equal(couleurDuTitre('Chemise à rayures'), 'motif');
  assert.equal(couleurDuTitre('Veste en lin'), null);
});

test('résultat SerpApi → article ; incomplet ou non https → écarté', () => {
  const q = {
    requete: 'robe bohème femme',
    vestiaire: 'femme' as const,
    style: 'boheme' as const,
    categorie: 'robe' as const,
  };
  const a = versArticle(
    {
      title: 'Robe longue blanche',
      product_id: '123',
      product_link: 'https://www.google.com/shopping/product/123',
      source: 'Boutique X',
      extracted_price: 39.9,
      thumbnail: 'https://encrypted-tbn2.gstatic.com/x',
    },
    q,
  );
  assert.equal(a?.source, 'web');
  assert.equal(a?.couleur, 'blanc');
  assert.equal(a?.prix, 39.9);
  assert.deepEqual(a?.styles, ['boheme']);
  assert.equal(versArticle({ title: 'x', product_id: '1', product_link: 'http://a', thumbnail: 'https://b' }, q), null);
  assert.equal(versArticle({ title: 'x', product_id: '1', product_link: 'https://a' }, q), null);
});

test('titres nettoyés, prix au-dessus du plafond écartés', () => {
  assert.equal(
    nettoyerTitre('Humility Robe chemise en popeline de coton Femme Taille'),
    'Humility Robe chemise en popeline de coton',
  );
  assert.equal(nettoyerTitre('Acne Studios, Top en coton, femme, gris, FR 34, tops'), 'Acne Studios, Top en coton');
  assert.equal(nettoyerTitre('Diesel Leamer Veste misaison, Femme, Taille: 48, Blue'), 'Diesel Leamer Veste misaison');
  assert.equal(nettoyerTitre('Jean droit bleu'), 'Jean droit bleu');
  const q = {
    requete: 'veste chic femme',
    vestiaire: 'femme' as const,
    style: 'chic' as const,
    categorie: 'veste' as const,
  };
  const cher = {
    title: 'Veste',
    product_id: '9',
    product_link: 'https://g.co/x',
    thumbnail: 'https://g.co/i',
    extracted_price: PRIX_MAX + 1,
  };
  assert.equal(versArticle(cher, q), null);
  const securite = { ...cher, title: 'Chaussures de sécurité légères', extracted_price: 40 };
  assert.equal(versArticle(securite, q), null);
});

test('vendeurs tiers et enseignes hors mode écartés, boutiques gardées', () => {
  for (const m of ['Amazon.fr - Seller', 'AliExpress', 'Tostadora FR', 'Leroy Merlin France']) assert.equal(marchandAccepte(m), false, m);
  for (const m of ['Amazon.fr', 'Zalando.fr', 'H&M FR', 'Sézane', 'Sellpy.fr']) assert.equal(marchandAccepte(m), true, m);
});
