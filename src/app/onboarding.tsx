import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { Question } from '@/components/onboarding/question';
import { ResultatSilhouette } from '@/components/onboarding/resultat-silhouette';
import { Ecran, Logo } from '@/components/ui';
import { conseilPour, type EpaulesHanches, type ReponsesMorpho, type Taille, type Ventre, type Vestiaire } from '@/lib/morphologie';
import { useProfil, type Style } from '@/state/profil';

type Etape = {
  question: string;
  options: { label: string; valeur: string }[];
  appliquer: (valeur: string) => void;
};

export default function Onboarding() {
  const { profil, pret, onboardingFini, majProfil, terminerOnboarding } = useProfil();
  const [index, setIndex] = useState(0);
  const [trop_jeune, setTropJeune] = useState(false);
  const [morpho, setMorpho] = useState<Partial<ReponsesMorpho>>({});

  const majMorpho = (maj: Partial<ReponsesMorpho>) => {
    const suivant = { ...morpho, ...maj };
    setMorpho(suivant);
    if (suivant.epaulesHanches && suivant.taille && suivant.ventre) {
      majProfil({ morpho: suivant as ReponsesMorpho });
    }
  };

  const homme = profil.vestiaire === 'homme';
  const etapes: Etape[] = [
    {
      question: 'Tu cherches des tenues…',
      options: [
        { label: 'Femme', valeur: 'femme' },
        { label: 'Homme', valeur: 'homme' },
      ],
      appliquer: (v) => majProfil({ vestiaire: v as Vestiaire }),
    },
    {
      question: 'Quel âge as-tu ?',
      options: [
        { label: 'Moins de 15 ans', valeur: '0' },
        { label: '15 à 24 ans', valeur: '20' },
        { label: '25 à 34 ans', valeur: '30' },
        { label: '35 à 44 ans', valeur: '40' },
        { label: '45 ans et plus', valeur: '50' },
      ],
      appliquer: (v) => (v === '0' ? setTropJeune(true) : majProfil({ age: Number(v) })),
    },
    {
      question: 'Le matin, le plus dur pour toi, c’est…',
      options: [
        { label: 'J’ai plein de vêtements mais rien à me mettre', valeur: 'rien_a_mettre' },
        { label: 'Rien ne me va vraiment', valeur: 'rien_ne_va' },
        { label: 'Je porte toujours la même chose', valeur: 'toujours_pareil' },
        { label: 'Je ne sais pas quoi associer', valeur: 'associer' },
      ],
      appliquer: (v) => majProfil({ gene: v }),
    },
    {
      question: 'Ton style, c’est plutôt…',
      options: [
        { label: 'Casual', valeur: 'casual' },
        { label: 'Chic', valeur: 'chic' },
        { label: 'Streetwear', valeur: 'streetwear' },
        homme ? { label: 'Minimaliste', valeur: 'minimaliste' } : { label: 'Clean girl', valeur: 'clean_girl' },
        homme ? { label: 'Workwear', valeur: 'workwear' } : { label: 'Bohème', valeur: 'boheme' },
        { label: 'Alternatif', valeur: 'alternatif' },
      ],
      appliquer: (v) => majProfil({ style: v as Style }),
    },
    {
      question: 'Tes épaules, par rapport à tes hanches ?',
      options: [
        { label: 'Plus larges', valeur: 'epaules_plus_larges' },
        { label: 'À peu près pareil', valeur: 'pareil' },
        { label: 'Plus étroites', valeur: 'hanches_plus_larges' },
      ],
      appliquer: (v) => majMorpho({ epaulesHanches: v as EpaulesHanches }),
    },
    {
      question: 'Ta taille est…',
      options: [
        { label: 'Bien marquée', valeur: 'marquee' },
        { label: 'Un peu marquée', valeur: 'un_peu' },
        { label: 'Pas marquée', valeur: 'pas_marquee' },
      ],
      appliquer: (v) => majMorpho({ taille: v as Taille }),
    },
    {
      question: 'Ton ventre est…',
      options: [
        { label: 'Plutôt plat', valeur: 'plat' },
        { label: 'Un peu arrondi', valeur: 'un_peu' },
        { label: 'Marqué', valeur: 'marque' },
      ],
      appliquer: (v) => majMorpho({ ventre: v as Ventre }),
    },
  ];

  if (pret && onboardingFini) return <Redirect href="/" />;

  if (trop_jeune) {
    return <Ecran enTete={<Logo />} titre="Désolé" intro="Pour l’instant, l’app est réservée aux 15 ans et plus." centre>{null}</Ecran>;
  }

  if (index >= etapes.length && profil.silhouette) {
    return (
      <Ecran enTete={<Logo />}>
        <ResultatSilhouette
          silhouette={profil.silhouette}
          conseil={conseilPour(profil.silhouette, profil.vestiaire ?? 'femme')}
          onContinuer={() => {
            void terminerOnboarding();
            router.replace('/dressing');
          }}
        />
      </Ecran>
    );
  }

  const numero = Math.min(index, etapes.length - 1);
  const etape = etapes[numero];
  return (
    <Ecran enTete={<Logo />}>
      <Question
        numero={numero + 1}
        total={etapes.length}
        question={etape.question}
        options={etape.options}
        onChoix={(valeur) => {
          etape.appliquer(valeur);
          setIndex((i) => i + 1);
        }}
        onRetour={numero > 0 ? () => setIndex((i) => Math.max(0, i - 1)) : undefined}
      />
    </Ecran>
  );
}
