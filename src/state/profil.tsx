import { createContext, useContext, useState, type ReactNode } from 'react';

import { deduireSilhouette, type ReponsesMorpho, type Silhouette } from '@/lib/morphologie';

// État en mémoire pour la V1 du squelette. Sera remplacé par Supabase (étape 2 du BRIEF).

export type Style = 'casual' | 'chic' | 'streetwear' | 'clean_girl' | 'boheme' | 'alternatif';

export type Profil = {
  age: number | null;
  style: Style | null;
  gene: string | null;
  morpho: ReponsesMorpho | null;
  silhouette: Silhouette | null;
};

type ProfilCtx = {
  profil: Profil;
  onboardingFini: boolean;
  majProfil: (maj: Partial<Profil>) => void;
  terminerOnboarding: () => void;
};

const vide: Profil = { age: null, style: null, gene: null, morpho: null, silhouette: null };

const Ctx = createContext<ProfilCtx | null>(null);

export function ProfilProvider({ children }: { children: ReactNode }) {
  const [profil, setProfil] = useState<Profil>(vide);
  const [onboardingFini, setOnboardingFini] = useState(false);

  const majProfil = (maj: Partial<Profil>) =>
    setProfil((p) => {
      const suivant = { ...p, ...maj };
      return suivant.morpho ? { ...suivant, silhouette: deduireSilhouette(suivant.morpho) } : suivant;
    });

  return (
    <Ctx.Provider value={{ profil, onboardingFini, majProfil, terminerOnboarding: () => setOnboardingFini(true) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProfil() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProfil doit être utilisé dans <ProfilProvider>');
  return ctx;
}
