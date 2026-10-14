// Edge Function : à partir du lien d'un article (Zara, Vinted…), récupère l'image principale de la page
// (balises og:image / twitter:image), la range dans vetements/<uid>/ et crée un essai.
// Avec `article_id` (catalogue, 14 oct. 2026) : l'image et le lien viennent de la table articles, sans lire la page.
// Tout passe avec le JWT de l'utilisateur : les règles RLS limitent l'écriture à son propre dossier.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const DELAI_MS = 8000;
const PAGE_MAX = 2_000_000;
const IMAGE_MAX = 5_000_000;
const TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

function reponse(statut: number, corps: Record<string, unknown>) {
  return new Response(JSON.stringify(corps), { status: statut, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

// Refuse les adresses internes (protection contre les requêtes vers le réseau privé).
function adresseAutorisee(url: URL): boolean {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  const hote = url.hostname.toLowerCase();
  if (hote === 'localhost' || hote.endsWith('.local') || hote.endsWith('.internal')) return false;
  if (hote.includes(':')) return false; // IPv6 littérale
  const ip = hote.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ip) {
    const [a, b] = [Number(ip[1]), Number(ip[2])];
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      return false;
    }
  }
  return true;
}

async function lireLimite(res: Response, max: number): Promise<Uint8Array> {
  const lecteur = res.body?.getReader();
  if (!lecteur) return new Uint8Array();
  const morceaux: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await lecteur.read();
    if (done) break;
    total += value.length;
    if (total > max) {
      await lecteur.cancel();
      throw new Error('trop_gros');
    }
    morceaux.push(value);
  }
  const tout = new Uint8Array(total);
  let pos = 0;
  for (const m of morceaux) {
    tout.set(m, pos);
    pos += m.length;
  }
  return tout;
}

function trouverImage(html: string, base: URL): URL | null {
  const motifs = [
    /<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    /<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i,
  ];
  for (const motif of motifs) {
    const m = html.match(motif);
    if (m) {
      try {
        return new URL(m[1].replaceAll('&amp;', '&'), base);
      } catch {
        // lien invalide : on essaie le motif suivant
      }
    }
  }
  return null;
}

async function telecharger(url: URL): Promise<Response> {
  return fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(DELAI_MS),
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; app-mode/0.1; apercu de lien)', Accept: 'text/html,image/*' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reponse(405, { erreur: 'Méthode non autorisée.' });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: utilisateur } = await supabase.auth.getUser();
  if (!utilisateur.user) return reponse(401, { erreur: 'Session invalide.' });
  const uid = utilisateur.user.id;

  let lien: URL;
  let imageArticle: URL | null = null;
  try {
    const { url, article_id } = await req.json();
    if (article_id) {
      // Article du catalogue : lu avec les droits de l'utilisateur (RLS : actif, et « test » pour les testeurs).
      const article = await supabase.from('articles').select('lien, image_url').eq('id', String(article_id)).maybeSingle();
      if (article.error || !article.data) return reponse(404, { erreur: 'Cet article n’est plus disponible.' });
      lien = new URL(article.data.lien);
      imageArticle = new URL(article.data.image_url);
    } else {
      lien = new URL(String(url));
    }
  } catch {
    return reponse(400, { erreur: 'Ce lien n’est pas valide.' });
  }
  if (!adresseAutorisee(lien)) return reponse(400, { erreur: 'Ce lien n’est pas autorisé.' });

  try {
    let urlImage: URL | null = imageArticle;
    if (!urlImage) {
      const page = await telecharger(lien);
      if (!page.ok) {
        return reponse(422, {
          erreur: 'Ce site bloque la lecture de sa page. Fais une capture d’écran de l’article et envoie-la en photo.',
        });
      }
      const html = new TextDecoder().decode(await lireLimite(page, PAGE_MAX));
      urlImage = trouverImage(html, new URL(page.url));
    }
    if (!urlImage || !adresseAutorisee(urlImage)) {
      return reponse(422, { erreur: 'Pas d’image trouvée sur cette page. Envoie plutôt une capture d’écran.' });
    }

    const image = await telecharger(urlImage);
    const type = (image.headers.get('content-type') ?? '').split(';')[0].trim();
    const extension = TYPES.get(type);
    if (!image.ok || !extension) {
      return reponse(422, { erreur: 'L’image de l’article n’a pas pu être récupérée. Envoie une capture d’écran.' });
    }
    const octets = await lireLimite(image, IMAGE_MAX);

    const chemin = `${uid}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
    const envoi = await supabase.storage.from('vetements').upload(chemin, octets, { contentType: type });
    if (envoi.error) return reponse(500, { erreur: `Enregistrement de l’image impossible : ${envoi.error.message}` });

    const essai = await supabase
      .from('essais')
      .insert({ source: 'lien', vetement_bucket: 'vetements', vetement_path: chemin, lien_url: lien.toString() })
      .select('id')
      .single();
    if (essai.error) {
      await supabase.storage.from('vetements').remove([chemin]);
      return reponse(500, { erreur: `Création de l’essai impossible : ${essai.error.message}` });
    }
    return reponse(200, { essai_id: essai.data.id, vetement_path: chemin });
  } catch (e) {
    const message = e instanceof Error && e.message === 'trop_gros' ? 'La page ou l’image est trop lourde.' : 'Le site met trop de temps à répondre.';
    return reponse(422, { erreur: message });
  }
});
