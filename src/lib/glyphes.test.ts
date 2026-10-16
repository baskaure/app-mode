// Verrou de la police : tout texte affiché doit exister dans Onest (police de l'app, choisie le 14 oct. 2026).
// Le 14 oct., « ✦ », « ♥ » et « ✕ » s'affichaient en carré vide sur le web : Onest ne les a pas.
// Pour un symbole, utiliser une icône (Icone, components/ui/actions.tsx) ou une forme dessinée, pas un caractère. npm test.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// Caractères non ASCII présents dans Onest (relevés dans la police avec fontTools).
const COUVERTS = new Set('\u00a0¡¢£¥§¨©ª«®¯°±²³´¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿĀāĂăĄąĆćĈĉĊċČčĎďĐđĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħĨĩĪīĬĭĮįİıĲĳĴĵĶķĸĹĺĻļĽľĿŀŁłŃńŅņŇňŉŊŋŌōŎŏŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹźŻżŽžſ–—‘’‚“”„•…\u202f‰‹›⁄€←→✓');

function fichiers(dossier: string): string[] {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
    const chemin = join(dossier, e.name);
    if (e.isDirectory()) return fichiers(chemin);
    return /\.tsx?$/.test(e.name) && !e.name.endsWith('.test.ts') ? [chemin] : [];
  });
}

test('aucun caractère absent de la police Onest dans le code de l’app', () => {
  const racine = join(import.meta.dirname, '..');
  const fautes: string[] = [];
  for (const f of fichiers(racine)) {
    // Les commentaires ne s'affichent pas.
    const code = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    for (const ch of new Set(code)) {
      if (ch.codePointAt(0)! > 127 && !COUVERTS.has(ch)) fautes.push(`${f} : « ${ch} » (U+${ch.codePointAt(0)!.toString(16).toUpperCase()})`);
    }
  }
  assert.deepEqual(fautes, []);
});
