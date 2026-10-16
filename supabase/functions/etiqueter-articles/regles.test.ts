// Verrou de l'étiquetage des articles : npm test.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { controler, lignes, type Entree } from './regles.ts';

const demandes: Entree[] = [
  { id: 'a', nom: 'LIAOPUFUS Femme Blazer Slim Fit Elégant Noir', marchand: 'Amazon.fr', categorie: 'veste', vestiaire: 'femme' },
  { id: 'b', nom: 'Déguisement de pirate enfant', marchand: 'Jouets', categorie: 'haut', vestiaire: 'homme' },
];

test('réponse valide : nom propre, valeurs « inconnue » et « aucune » ramenées à vide', () => {
  const r = controler(
    {
      articles: [
        { id: 'a', garder: true, nom_court: '  blazer cintré   noir ', categorie: 'veste', couleur: 'noir', coupe: 'cintre' },
        { id: 'b', garder: false, nom_court: '', categorie: 'haut', couleur: 'inconnue', coupe: 'aucune' },
      ],
    },
    demandes,
  );
  assert.deepEqual(r[0], { id: 'a', garder: true, nom_court: 'Blazer cintré noir', categorie: 'veste', couleur: 'noir', coupe: 'cintre' });
  assert.equal(r[1].garder, false);
  assert.equal(r[1].couleur, null);
  assert.equal(r[1].coupe, null);
});

test('id non demandé, catégorie inconnue ou article gardé sans nom : ignorés', () => {
  const r = controler(
    {
      articles: [
        { id: 'z', garder: true, nom_court: 'Jean', categorie: 'bas', couleur: 'bleu', coupe: 'droit' },
        { id: 'a', garder: true, nom_court: 'Blazer', categorie: 'chapeau', couleur: 'noir', coupe: 'aucune' },
        { id: 'b', garder: true, nom_court: '', categorie: 'haut', couleur: 'noir', coupe: 'aucune' },
      ],
    },
    demandes,
  );
  assert.deepEqual(r, []);
  assert.deepEqual(controler(null, demandes), []);
  assert.deepEqual(controler({ articles: 'non' }, demandes), []);
});

test('envoyé à l’IA : une ligne JSON par article, sans donnée d’utilisateur', () => {
  const t = lignes(demandes).split('\n');
  assert.equal(t.length, 2);
  assert.deepEqual(Object.keys(JSON.parse(t[0])), ['id', 'titre', 'marchand', 'categorie', 'vestiaire']);
});
