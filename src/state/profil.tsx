import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { deduireSilhouette, type ReponsesMorpho, type Silhouette, type Vestiaire } from '@/lib/morphologie';
import { supabase } from '@/lib/supabase';

export type Style = 'casual' | 'chic' | 'streetwear' | 'clean_girl' | 'minimaliste' | 'boheme' | 'workwear' | 'alternatif';

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
async function utilisateurCourant(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: anonyme, error } = await supabase.auth.signInAnonymously();
  if (error || !anonyme.user) throw new Error(error?.message ?? 'Connexion anonyme impossible');
  return anonyme.user.id;
}

export function ProfilProvider({ children }: { children: ReactNode }) {
  const [profil, setProfil] = useState<Profil>(vide);
  const [onboardingFini, setOnboardingFini] = useState(false);
  const [pret, setPret] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const id = await utilisateurCourant();
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
  }, []);

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
      const id = await utilisateurCourant();
      const { error } = await supabase.from('profils').upsert({
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

  return (
    <Ctx.Provider value={{ profil, pret, onboardingFini, erreur, majProfil, terminerOnboarding }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProfil() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProfil doit être utilisé dans <ProfilProvider>');
  return ctx;
}
