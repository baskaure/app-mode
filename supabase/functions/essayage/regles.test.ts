// Verrou du filtre lingerie : npm run test:filtre (Node 24, types effacés à la volée).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CATEGORIES_AUTORISEES,
  CATEGORIES_REFUSEES,
  decider,
  deciderResultat,
  MESSAGES,
  SCHEMA,
  SCHEMA_RESULTAT,
} from './regles.ts';

const ok = { vetement_categorie: 'haut', vetement_autorise: true, personne_autorisee: true } as const;

test('un haut sur une photo correcte passe', () => {
  assert.deepEqual(decider(ok), { autorise: true });
});

test('lingerie, maillot et transparent sont bloqués même si le modèle dit autorisé', () => {
  for (const c of ['lingerie_sous_vetement', 'maillot_de_bain', 'transparent'] as const) {
    assert.deepEqual(decider({ ...ok, vetement_categorie: c }), { autorise: false, message: MESSAGES.lingerie });
  }
});

test('une catégorie autorisée mais jugée sexualisée est bloquée', () => {
  assert.equal(decider({ ...ok, vetement_autorise: false }).autorise, false);
});

test('une photo de soi dénudée bloque, quel que soit le vêtement', () => {
  assert.deepEqual(decider({ ...ok, personne_autorisee: false }), { autorise: false, message: MESSAGES.personne });
});

test('des chaussures passent (le 15 oct. 2026 elles étaient classées « pas un vêtement »)', () => {
  assert.deepEqual(decider({ ...ok, vetement_categorie: 'chaussures' }), { autorise: true });
  assert.ok((CATEGORIES_AUTORISEES as readonly string[]).includes('chaussures'));
});

test('pas de vêtement visible : message dédié', () => {
  assert.deepEqual(decider({ ...ok, vetement_categorie: 'pas_un_vetement' }), {
    autorise: false,
    message: MESSAGES.pas_un_vetement,
  });
});

test('réponse absente ou inconnue : bloqué (fail-closed)', () => {
  assert.equal(decider(null).autorise, false);
  assert.equal(decider({ ...ok, vetement_categorie: 'inconnue' as never }).autorise, false);
});

test('le schéma JSON liste exactement les catégories du code', () => {
  assert.deepEqual(SCHEMA.properties.vetement_categorie.enum, [...CATEGORIES_AUTORISEES, ...CATEGORIES_REFUSEES]);
  assert.equal(SCHEMA.additionalProperties, false);
});

test('un booléen mal formé (texte "true") ne vaut pas un feu vert', () => {
  assert.equal(decider({ ...ok, vetement_autorise: 'true' as never }).autorise, false);
  assert.equal(decider({ ...ok, personne_autorisee: 1 as never }).autorise, false);
});

const propre = { personne_habillee: true, nudite_ou_sous_vetements: false, zone_floutee_sur_le_corps: false };

test('image produite : une personne habillée normalement passe', () => {
  assert.equal(deciderResultat(propre), true);
});

test('image produite : nudité, sous-vêtements ou zone floutée (cas Kling du 12 oct.) bloquent', () => {
  assert.equal(deciderResultat({ ...propre, nudite_ou_sous_vetements: true }), false);
  assert.equal(deciderResultat({ ...propre, zone_floutee_sur_le_corps: true }), false);
  assert.equal(deciderResultat({ ...propre, personne_habillee: false }), false);
});

test('image produite : réponse absente ou mal formée bloque', () => {
  assert.equal(deciderResultat(null), false);
  assert.equal(deciderResultat({ ...propre, nudite_ou_sous_vetements: 'false' as never }), false);
  assert.equal(deciderResultat({ ...propre, personne_habillee: 1 as never }), false);
});

test('schéma de l’image produite : strict', () => {
  assert.equal(SCHEMA_RESULTAT.additionalProperties, false);
  assert.deepEqual(SCHEMA_RESULTAT.required, Object.keys(propre));
});
