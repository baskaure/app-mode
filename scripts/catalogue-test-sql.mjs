// Transforme la sélection de test (supabase/seed/catalogue-test/*.json) en SQL à exécuter dans Supabase.
// Usage : node scripts/catalogue-test-sql.mjs > /tmp/catalogue-test.sql
// Ces articles (source 'test') ne sont visibles que des comptes testeurs : les images appartiennent aux marques.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DOSSIER = join(import.meta.dirname, '..', 'supabase', 'seed', 'catalogue-test');
const CATEGORIES = ['haut', 'bas', 'robe', 'veste', 'chaussures', 'accessoire'];
const COULEURS = ['noir', 'blanc', 'beige', 'gris', 'marine', 'bleu', 'marron', 'kaki', 'vert', 'rouge', 'rose', 'jaune', 'violet', 'orange', 'motif'];
const STYLES = ['casual', 'chic', 'streetwear', 'clean_girl', 'minimaliste', 'boheme', 'workwear', 'alternatif'];

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replaceAll("'", "''")}'`);
const lignes = [];
const erreurs = [];
for (const fichier of readdirSync(DOSSIER).filter((f) => f.endsWith('.json')).sort()) {
  for (const a of JSON.parse(readFileSync(join(DOSSIER, fichier), 'utf8'))) {
    const probleme =
      (!/^https:\/\//.test(a.lien) && 'lien') ||
      (!/^https:\/\//.test(a.image_url) && 'image_url') ||
      (!CATEGORIES.includes(a.categorie) && 'categorie') ||
      (a.couleur && !COULEURS.includes(a.couleur) && 'couleur') ||
      (!['femme', 'homme', 'mixte'].includes(a.vestiaire) && 'vestiaire') ||
      (!Array.isArray(a.styles) || a.styles.some((s) => !STYLES.includes(s))) && 'styles';
    if (probleme) {
      erreurs.push(`${fichier} : ${a.nom} (${probleme})`);
      continue;
    }
    const prix = typeof a.prix === 'number' ? a.prix.toFixed(2) : 'null';
    const styles = `array[${a.styles.map(q).join(', ')}]::text[]`;
    lignes.push(
      `(${['test', a.lien, a.marque ?? 'inconnu', a.marque, a.nom].map(q).join(', ')}, ${prix}, ${q(a.image_url)}, ${q(a.lien)}, ` +
        `${q(a.categorie)}, ${q(a.couleur ?? null)}, ${q(a.vestiaire)}, ${styles})`,
    );
  }
}
if (erreurs.length) console.error(`Écartés :\n${erreurs.join('\n')}`);
console.log(`insert into public.articles (source, id_source, marchand, marque, nom, prix, image_url, lien, categorie, couleur, vestiaire, styles)
values
${lignes.join(',\n')}
on conflict (source, id_source) do update set
  marchand = excluded.marchand, marque = excluded.marque, nom = excluded.nom, prix = excluded.prix,
  image_url = excluded.image_url, categorie = excluded.categorie, couleur = excluded.couleur,
  vestiaire = excluded.vestiaire, styles = excluded.styles, actif = true, maj_at = now();`);
