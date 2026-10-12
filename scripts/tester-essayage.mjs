// Essai de bout en bout de la fonction `essayage` (OpenAI) avec un compte anonyme jetable.
// Usage : node scripts/tester-essayage.mjs <racine du projet> <photo personne> <photo vêtement> <sortie.jpg>
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const [racine, photoPersonne, photoVetement, sortie] = process.argv.slice(2);
const require = createRequire(path.join(racine, 'package.json'));
const { createClient } = require('@supabase/supabase-js');

const env = Object.fromEntries(
  readFileSync(path.join(racine, '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

const { data: session, error: e1 } = await supabase.auth.signInAnonymously();
if (e1) throw e1;
const uid = session.user.id;
console.log('compte de test', uid);

const envoyer = async (bucket, fichier) => {
  const chemin = `${uid}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(chemin, readFileSync(fichier), { contentType: 'image/jpeg' });
  if (error) throw error;
  return chemin;
};

const photoSoi = await envoyer('silhouettes', photoPersonne);
const { data: profil } = await supabase.from('profils').select('id').eq('id', uid).maybeSingle();
const champs = { photo_soi_path: photoSoi, consentement_photo_at: new Date().toISOString() };
const maj = profil
  ? await supabase.from('profils').update(champs).eq('id', uid)
  : await supabase.from('profils').insert({ id: uid, ...champs });
if (maj.error) throw maj.error;

const vetement = await envoyer('vetements', photoVetement);
const { data: essai, error: e2 } = await supabase
  .from('essais')
  .insert({ source: 'photo', vetement_bucket: 'vetements', vetement_path: vetement })
  .select('id')
  .single();
if (e2) throw e2;

const appeler = async (action) => {
  const { data, error } = await supabase.functions.invoke('essayage', { body: { action, essai_id: essai.id } });
  if (error) throw new Error(`${action}: ${await error.context?.text?.()}`);
  return data;
};

const debut = Date.now();
let etat = await appeler('lancer');
console.log('lancer →', etat, `${((Date.now() - debut) / 1000).toFixed(1)} s`);
while (etat.statut === 'en_cours' && Date.now() - debut < 200_000) {
  await new Promise((r) => setTimeout(r, 3000));
  etat = await appeler('suivre');
}
console.log('fin →', etat, `${((Date.now() - debut) / 1000).toFixed(1)} s`);
if (etat.statut === 'fait') {
  const { data } = await supabase.storage.from('essayages').download(etat.resultat_path);
  writeFileSync(sortie, Buffer.from(await data.arrayBuffer()));
  console.log('image enregistrée', sortie);
}
console.log('UID', uid);
