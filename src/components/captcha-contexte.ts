import { createContext, useContext } from 'react';

// Demande un jeton CAPTCHA. Renvoie undefined si le CAPTCHA n'est pas configuré (pas de clé de site).
export type DemanderJeton = () => Promise<string | undefined>;

export const CaptchaContexte = createContext<DemanderJeton | null>(null);

export function useCaptcha(): DemanderJeton {
  const demander = useContext(CaptchaContexte);
  if (!demander) throw new Error('useCaptcha doit être utilisé dans <CaptchaProvider>');
  return demander;
}
