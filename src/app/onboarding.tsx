import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton, Choix } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { conseilPour, type EpaulesHanches, type ReponsesMorpho, type Taille, type Ventre, type Vestiaire } from '@/lib/morphologie';
import { useProfil, type Style } from '@/state/profil';

type Etape = {
  question: string;
  options: { label: string; valeur: string }[];
  appliquer: (valeur: string) => void;
};

export default function Onboarding() {
  const { profil, majProfil, terminerOnboarding } = useProfil();
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

  if (trop_jeune) {
    return (
      <Ecran>
        <ThemedText type="subtitle">Désolé</ThemedText>
        <ThemedText>Pour l’instant, l’app est réservée aux 15 ans et plus.</ThemedText>
      </Ecran>
    );
  }

  if (index >= etapes.length && profil.silhouette) {
    const conseil = conseilPour(profil.silhouette, profil.vestiaire ?? 'femme');
    return (
      <Ecran>
        <ThemedText type="small" themeColor="textSecondary">
          Ta morphologie
        </ThemedText>
        <ThemedText type="subtitle">{conseil.nom}</ThemedText>
        <ThemedText>{conseil.objectif}</ThemedText>
        <View style={styles.liste}>
          {conseil.aPrivilegier.map((c) => (
            <ThemedText key={c}>• {c}</ThemedText>
          ))}
        </View>
        <ThemedText>Prends 3 vêtements de ton placard en photo : je te compose tes premières tenues.</ThemedText>
        <Bouton
          label="Ajouter mes 3 premières pièces"
          onPress={() => {
            terminerOnboarding();
            router.replace('/dressing');
          }}
        />
      </Ecran>
    );
  }

  const etape = etapes[Math.min(index, etapes.length - 1)];
  return (
    <Ecran>
      <ThemedText type="small" themeColor="textSecondary">
        {index + 1} / {etapes.length}
      </ThemedText>
      <ThemedText type="subtitle">{etape.question}</ThemedText>
      <View style={styles.options}>
        {etape.options.map((o) => (
          <Choix
            key={o.valeur}
            label={o.label}
            onPress={() => {
              etape.appliquer(o.valeur);
              setIndex((i) => i + 1);
            }}
          />
        ))}
      </View>
    </Ecran>
  );
}

function Ecran({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView style={styles.fond}>
      <SafeAreaView style={styles.zone}>
        <ScrollView contentContainerStyle={styles.contenu}>{children}</ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  contenu: { padding: Spacing.four, gap: Spacing.three },
  options: { gap: Spacing.two, marginTop: Spacing.two },
  liste: { gap: Spacing.one },
});
