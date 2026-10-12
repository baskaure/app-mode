import { useCallback, type ReactNode } from 'react';

import { CaptchaContexte } from '@/components/captcha-contexte';
import { CLE_SITE_CAPTCHA, DELAI_CAPTCHA_MS, SCRIPT_TURNSTILE } from '@/lib/captcha';

type Turnstile = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

let chargement: Promise<Turnstile> | null = null;

// Charge le script de Cloudflare une seule fois.
function chargerTurnstile(): Promise<Turnstile> {
  chargement ??= new Promise<Turnstile>((resoudre, rejeter) => {
    const script = document.createElement('script');
    script.src = SCRIPT_TURNSTILE;
    script.async = true;
    script.onload = () => resoudre((window as unknown as { turnstile: Turnstile }).turnstile);
    script.onerror = () => {
      chargement = null;
      rejeter(new Error('Vérification anti-robot indisponible. Vérifie ta connexion.'));
    };
    document.head.appendChild(script);
  });
  return chargement;
}

// Web : le widget Turnstile est posé directement dans la page, en bas de l'écran, le temps d'obtenir un jeton.
export function CaptchaProvider({ children }: { children: ReactNode }) {
  const demanderJeton = useCallback(async () => {
    if (!CLE_SITE_CAPTCHA) return undefined;
    const turnstile = await chargerTurnstile();
    const cadre = document.createElement('div');
    cadre.style.cssText = 'position:fixed;left:0;right:0;bottom:48px;display:flex;justify-content:center;z-index:1000';
    document.body.appendChild(cadre);
    let id: string | undefined;
    try {
      return await new Promise<string>((resoudre, rejeter) => {
        const minuteur = setTimeout(
          () => rejeter(new Error('Vérification anti-robot trop longue. Vérifie ta connexion, puis touche « Réessayer ».')),
          DELAI_CAPTCHA_MS,
        );
        id = turnstile.render(cadre, {
          sitekey: CLE_SITE_CAPTCHA,
          appearance: 'interaction-only',
          callback: (jeton: string) => {
            clearTimeout(minuteur);
            resoudre(jeton);
          },
          'error-callback': (code: string) => {
            clearTimeout(minuteur);
            rejeter(new Error(`Vérification anti-robot impossible (turnstile ${code}).`));
          },
        });
      });
    } finally {
      if (id) turnstile.remove(id);
      cadre.remove();
    }
  }, []);

  return <CaptchaContexte.Provider value={demanderJeton}>{children}</CaptchaContexte.Provider>;
}
