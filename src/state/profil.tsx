import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useCaptcha, type DemanderJeton } from '@/components/captcha-contexte';
import { ConnexionRatee } from '@/components/connexion-ratee';
import { changerUtilisateurAchats, configurerAchats } from '@/lib/abonnement';
import { deduireSilhouette, type ReponsesMorpho, type Silhouette, type Vestiaire } from '@/lib/morphologie';
import { supabase } from '@/lib/supabase';
import { reprendreSession } from '@/lib/sauvegarde-session';

export type Style =
  'casual' | 'chic' | 'streetwear' | 'clean_girl' | 'minimaliste' | 'boheme' | 'workwear' | 'alternatif';

export type Profil = {
  vestiaire: Vestiaire | null;
  age: number | null;
  style: Style | null;
  gene: string | null;
  morpho: ReponsesMorpho | null;
  silhouette: Silhouette | null;
};

type ProfilCtx = {
  profil: Profil;
  pret: boolean;
  onboardingFini: boolean;
  erreur: string | null;
  majProfil: (maj: Partial<Profil>) => void;
  terminerOnboarding: () => Promise<void>;
  repartirDeZero: () => Promise<void>;
};

const vide: Profil = { vestiaire: null, age: null, style: null, gene: null, morpho: null, silhouette: null };

const Ctx = createContext<ProfilCtx | null>(null);

// Ligne de la table public.profils (voir supabase/migrations).
type LigneProfil = {
  vestiaire: Vestiaire | null;
  age: number | null;
  style: Style | null;
  gene: string | null;
  epaules_hanches: ReponsesMorpho['epaulesHanches'] | null;
  taille: ReponsesMorpho['taille'] | null;
  ventre: ReponsesMorpho['ventre'] | null;
  silhouette: Silhouette | null;
  onboarding_fini: boolean;
};

function depuisLigne(l: LigneProfil): Profil {
  const morpho =
    l.epaules_hanches && l.taille && l.ventre
      ? { epaulesHanches: l.epaules_hanches, taille: l.taille, ventre: l.ventre }
      : null;
  return { vestiaire: l.vestiaire, age: l.age, style: l.style, gene: l.gene, morpho, silhouette: l.silhouette };
}

// Un compte anonyme est créé au premier lancement : aucune adresse e-mail demandée avant le moment « waouh ».
// Sa création passe par un CAPTCHA (Turnstile) quand il est configuré : voir src/lib/captcha.ts.
async function utilisateurCourant(demanderJeton: DemanderJeton): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  // App réinstallée : on reprend le compte d'avant si son jeton est encore dans le trousseau.
  const repris = await reprendreSession();
  if (repris) return repris;
  const captchaToken = await demanderJeton();
  const { data: anonyme, error } = await supabase.auth.signInAnonymously({ options: { captchaToken } });
  if (error || !anonyme.user) throw new Error(error?.message ?? 'Connexion anonyme impossible');
  return anonyme.user.id;
}

export function ProfilProvider({ children }: { children: ReactNode }) {
  const demanderJeton = useCaptcha();
  const [profil, setProfil] = useState<Profil>(vide);
  const [onboardingFini, setOnboardingFini] = useState(false);
  const [pret, setPret] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  // Pas de compte (CAPTCHA raté, pas de réseau…) : rien ne peut marcher, on le dit au lieu de continuer à vide.
  const [connexionRatee, setConnexionRatee] = useState<string | null>(null);
  const [tentative, setTentative] = useState(0);

  useEffect(() => {
    let annule = false;
    (async () => {
      let id: string;
      try {
        id = await utilisateurCourant(demanderJeton);
      } catch (e) {
        if (!annule) {
          setConnexionRatee(e instanceof Error ? e.message : String(e));
          setPret(true);
        }
        return;
      }
      try {
        // RevenueCat suit le même id que Supabase : le serveur vérifie l'abonnement avec cet id.
        configurerAchats(id);
        const { data, error } = await supabase.from('profils').select('*').eq('id', id).maybeSingle<LigneProfil>();
        if (error) throw error;
        if (!annule && data) {
          setProfil(depuisLigne(data));
          setOnboardingFini(data.onboarding_fini);
        }
      } catch (e) {
        if (!annule) setErreur(e instanceof Error ? e.message : String(e));
      } finally {
        if (!annule) setPret(true);
      }
    })();
    return () => {
      annule = true;
    };
  }, [demanderJeton, tentative]);

  const reessayer = () => {
    setConnexionRatee(null);
    setPret(false);
    setTentative((t) => t + 1);
  };

  const majProfil = (maj: Partial<Profil>) =>
    setProfil((p) => {
      const suivant = { ...p, ...maj };
      return suivant.morpho
        ? { ...suivant, silhouette: deduireSilhouette(suivant.morpho, suivant.vestiaire ?? 'femme') }
        : suivant;
    });

  const terminerOnboarding = async () => {
    setOnboardingFini(true);
    try {
      const id = await utilisateurCourant(demanderJeton);
      const { error } = await supabase
        .from('profils')
        .upsert({
          id,
          vestiaire: profil.vestiaire,
          age: profil.age,
          style: profil.style,
          gene: profil.gene,
          epaules_hanches: profil.morpho?.epaulesHanches ?? null,
          taille: profil.morpho?.taille ?? null,
          ventre: profil.morpho?.ventre ?? null,
          silhouette: profil.silhouette,
          onboarding_fini: true,
        });
      if (error) throw error;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  };

  // Après « Supprimer toutes mes données » : le compte n'existe plus. On oublie la session locale,
  // on vide l'état et on recrée un compte anonyme neuf, comme au premier lancement.
  const repartirDeZero = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setProfil(vide);
    setOnboardingFini(false);
    setErreur(null);
    let id: string;
    try {
      id = await utilisateurCourant(demanderJeton);
    } catch (e) {
      // Les données sont déjà effacées : sans nouveau compte, on montre l'écran « Connexion impossible ».
      setConnexionRatee(e instanceof Error ? e.message : String(e));
      return;
    }
    await changerUtilisateurAchats(id);
  };

  return (
    <Ctx.Provider value={{ profil, pret, onboardingFini, erreur, majProfil, terminerOnboarding, repartirDeZero }}>
      {connexionRatee ? <ConnexionRatee message={connexionRatee} onReessayer={reessayer} /> : children}
    </Ctx.Provider>
  );
}

export function useProfil() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProfil doit être utilisé dans <ProfilProvider>');
  return ctx;
}
