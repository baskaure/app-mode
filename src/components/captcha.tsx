import { useCallback, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { CaptchaContexte } from '@/components/captcha-contexte';
import { CLE_SITE_CAPTCHA, DELAI_CAPTCHA_MS, DOMAINE_CAPTCHA, lireMessageCaptcha, pageCaptcha } from '@/lib/captcha';

type Attente = { resoudre: (jeton: string) => void; rejeter: (e: Error) => void };

// Téléphone : le widget Turnstile tourne dans une petite WebView, affichée seulement le temps d'obtenir un jeton.
// Le web a sa propre version (captcha.web.tsx), sans WebView.
export function CaptchaProvider({ children }: { children: ReactNode }) {
  const [actif, setActif] = useState(false);
  const attente = useRef<Attente | null>(null);

  const demanderJeton = useCallback(() => {
    if (!CLE_SITE_CAPTCHA) return Promise.resolve(undefined);
    // Sans domaine déclaré, Cloudflare refuserait le widget : on le dit clairement au lieu d'attendre 30 s.
    if (!DOMAINE_CAPTCHA) {
      return Promise.reject(new Error('Vérification anti-robot mal configurée (EXPO_PUBLIC_TURNSTILE_DOMAINE manquant).'));
    }
    return new Promise<string>((resoudre, rejeter) => {
      const finir = () => {
        clearTimeout(minuteur);
        attente.current = null;
        setActif(false);
      };
      const minuteur = setTimeout(() => {
        finir();
        rejeter(new Error('Vérification anti-robot trop longue. Vérifie ta connexion, puis touche « Réessayer ».'));
      }, DELAI_CAPTCHA_MS);
      attente.current = {
        resoudre: (jeton) => {
          finir();
          resoudre(jeton);
        },
        rejeter: (e) => {
          finir();
          rejeter(e);
        },
      };
      setActif(true);
    });
  }, []);

  return (
    <CaptchaContexte.Provider value={demanderJeton}>
      {children}
      {actif && CLE_SITE_CAPTCHA && DOMAINE_CAPTCHA && (
        <View style={styles.cadre} pointerEvents="box-none">
          <WebView
            style={styles.vue}
            originWhitelist={['*']}
            source={{ html: pageCaptcha(CLE_SITE_CAPTCHA), baseUrl: `https://${DOMAINE_CAPTCHA}` }}
            onMessage={(e) => {
              const message = lireMessageCaptcha(e.nativeEvent.data);
              if ('jeton' in message) attente.current?.resoudre(message.jeton);
              else attente.current?.rejeter(new Error(`Vérification anti-robot impossible (${message.erreur}).`));
            }}
          />
        </View>
      )}
    </CaptchaContexte.Provider>
  );
}

const styles = StyleSheet.create({
  cadre: { position: 'absolute', left: 0, right: 0, bottom: 48, alignItems: 'center' },
  vue: { width: 320, height: 80, backgroundColor: 'transparent' },
});
