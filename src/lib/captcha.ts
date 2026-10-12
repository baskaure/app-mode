// CAPTCHA (Cloudflare Turnstile) avant la création d'un compte anonyme : un robot ne peut plus fabriquer des comptes
// à la chaîne pour récupérer des essayages offerts. Supabase vérifie le jeton (Auth > Bot and Abuse Protection).
// Sans EXPO_PUBLIC_TURNSTILE_SITE_KEY, pas de CAPTCHA : l'app marche comme avant.
// Sans import : testé par src/lib/captcha.test.ts (npm test).

export const CLE_SITE_CAPTCHA = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || undefined;
// Le widget Turnstile n'accepte que les domaines déclarés chez Cloudflare. Dans l'app mobile, la page du widget
// est chargée « comme si » elle venait de ce domaine (WebView, baseUrl).
export const DOMAINE_CAPTCHA = process.env.EXPO_PUBLIC_TURNSTILE_DOMAINE || undefined;
export const DELAI_CAPTCHA_MS = 30_000;
export const SCRIPT_TURNSTILE = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export type MessageCaptcha = { jeton: string } | { erreur: string };

// Message envoyé par la page du widget (WebView) : {"jeton": "..."} ou {"erreur": "..."}.
export function lireMessageCaptcha(brut: string): MessageCaptcha {
  try {
    const m = JSON.parse(brut) as { jeton?: unknown; erreur?: unknown };
    if (typeof m.jeton === 'string' && m.jeton.length > 0) return { jeton: m.jeton };
    return { erreur: typeof m.erreur === 'string' ? m.erreur : 'réponse inconnue' };
  } catch {
    return { erreur: 'réponse illisible' };
  }
}

// Page HTML minimale du widget pour la WebView. `interaction-only` : invisible, sauf si Cloudflare doute.
export function pageCaptcha(cleSite: string): string {
  const cle = JSON.stringify(cleSite);
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;background:transparent;display:flex;justify-content:center}</style>
<script src="${SCRIPT_TURNSTILE}" async defer onload="demarrer()"></script></head><body><div id="w"></div><script>
function envoyer(m){window.ReactNativeWebView.postMessage(JSON.stringify(m))}
function demarrer(){turnstile.render('#w',{sitekey:${cle},appearance:'interaction-only',
callback:function(t){envoyer({jeton:t})},
'error-callback':function(c){envoyer({erreur:'turnstile '+c})},
'expired-callback':function(){envoyer({erreur:'expiré'})}})}
</script></body></html>`;
}
