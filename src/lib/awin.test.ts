// Verrou de la lecture des flux Awin : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lireCsv, versArticle } from './awin.ts';

const FLUX = [
  'aw_product_id,product_name,aw_deep_link,aw_image_url,search_price,currency,merchant_name,brand_name,merchant_category,colour,Fashion:suitable_for',
  '101,"Jean droit, taille haute",https://www.awin1.com/pclick.php?p=101,https://images2.productserve.com/a.jpg,49.99,EUR,Boutique,Marque,Jeans,Bleu délavé,Femme',
  '102,"Robe ""fleurie"" midi",https://www.awin1.com/pclick.php?p=102,https://images2.productserve.com/b.jpg,"59,90",EUR,Boutique,,Robes,,women',
  '103,Soutien-gorge dentelle,https://www.awin1.com/pclick.php?p=103,https://images2.productserve.com/c.jpg,25,EUR,Boutique,,Lingerie,Noir,Femme',
  '104,Blazer en laine,https://www.awin1.com/pclick.php?p=104,http://images2.productserve.com/d.jpg,120,EUR,Boutique,,Vestes,Noir,Homme',
].join('\r\n');

test('CSV : virgules et guillemets dans les champs', () => {
  const lignes = lireCsv(FLUX);
  assert.equal(lignes.length, 4);
  assert.equal(lignes[0].product_name, 'Jean droit, taille haute');
  assert.equal(lignes[1].product_name, 'Robe "fleurie" midi');
  assert.equal(lignes[1].search_price, '59,90');
});

test('conversion : catégorie, couleur, vestiaire, prix, styles', () => {
  const [jean, robe] = lireCsv(FLUX).map(versArticle);
  assert.equal(jean?.categorie, 'bas');
  assert.equal(jean?.couleur, 'bleu');
  assert.equal(jean?.vestiaire, 'femme');
  assert.equal(jean?.prix, 49.99);
  assert.ok(jean?.styles.includes('casual'));
  assert.equal(robe?.categorie, 'robe');
  assert.equal(robe?.couleur, 'motif');
  assert.equal(robe?.prix, 59.9);
  assert.ok(robe?.styles.includes('boheme'));
});

test('jamais de lingerie, et jamais d’image en http', () => {
  const [, , lingerie, blazerHttp] = lireCsv(FLUX).map(versArticle);
  assert.equal(lingerie, null);
  assert.equal(blazerHttp, null);
});
