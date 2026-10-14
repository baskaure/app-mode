// Verrou du plein écran : npm test.
// Le 15 oct. 2026, les boutons de l'image en plein écran passaient sous la barre d'état : dans un écran
// « fullScreenModal », SafeAreaView ne comptait pas toujours la barre d'état. Ces écrans lisent les marges
// avec useSafeAreaInsets.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const APP = join(import.meta.dirname, '..', 'app');

test('les écrans plein écran utilisent useSafeAreaInsets, pas SafeAreaView', () => {
  const layout = readFileSync(join(APP, '_layout.tsx'), 'utf8');
  const ecrans = [...layout.matchAll(/name="([^"]+)" options=\{\{ presentation: 'fullScreenModal'/g)].map((m) => m[1]);
  assert.ok(ecrans.length > 0);
  for (const nom of ecrans) {
    const code = readFileSync(join(APP, `${nom}.tsx`), 'utf8');
    assert.ok(!/<SafeAreaView/.test(code), `${nom}.tsx ne doit pas utiliser SafeAreaView`);
    assert.ok(/useSafeAreaInsets\(\)/.test(code), `${nom}.tsx doit lire les marges avec useSafeAreaInsets`);
  }
});
