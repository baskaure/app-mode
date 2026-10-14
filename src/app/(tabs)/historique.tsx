import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CarteEssai } from '@/components/historique/carte-essai';
import { Chargement, Ecran, EtatVide, Grille, MessageErreur, Pastille } from '@/components/ui';
import { Espace } from '@/constants/theme';
import { filtrerParAvis, type Filtre } from '@/lib/avis';
import { listerEssais, supprimerEssai, type EssaiHistorique } from '@/lib/historique';

// Onglet « Essayages » : les essayages passés, du plus récent au plus ancien. Toucher une carte rouvre l'essai
// (le résultat s'il est fait, sinon l'écran pour le lancer).
export default function Historique() {
  const [essais, setEssais] = useState<EssaiHistorique[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  // Suppression en deux temps : un premier appui demande confirmation.
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<Filtre>('tous');

  // Relu à chaque retour sur l'onglet (un essayage vient peut-être de se terminer).
  useFocusEffect(
    useCallback(() => {
      let annule = false;
      listerEssais()
        .then((liste) => {
          if (annule) return;
          setEssais(liste);
          setErreur(null);
        })
        .catch((e: unknown) => !annule && setErreur(e instanceof Error ? e.message : String(e)))
        .finally(() => !annule && setChargement(false));
      return () => {
        annule = true;
      };
    }, []),
  );

  const supprimer = async (essai: EssaiHistorique) => {
    if (aConfirmer !== essai.id) {
      setAConfirmer(essai.id);
      return;
    }
    setAConfirmer(null);
    try {
      await supprimerEssai(essai);
      setEssais((liste) => liste.filter((e) => e.id !== essai.id));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  };

  const maintenant = new Date();
  const affiches = filtrerParAvis(essais, filtre);

  return (
    <Ecran onglet eyebrow="Essayages" titre="Tes essayages">
      <MessageErreur>{erreur}</MessageErreur>

      {chargement ? (
        <Chargement />
      ) : essais.length === 0 ? (
        <EtatVide
          titre="Rien pour l’instant"
          texte="Tes essayages apparaîtront ici. Choisis un vêtement pour commencer."
          action={{ label: 'Choisir un vêtement à essayer', onPress: () => router.push('/vetement') }}
        />
      ) : (
        <>
          <View style={styles.filtres}>
            <Pastille label="Tous" selectionne={filtre === 'tous'} onPress={() => setFiltre('tous')} />
            <Pastille label="J’aime" selectionne={filtre === 'aime'} onPress={() => setFiltre('aime')} />
          </View>
          {affiches.length === 0 && (
            <ThemedText themeColor="textSecondary">Aucun essayage aimé pour l’instant. Touche « J’aime » sous un résultat.</ThemedText>
          )}
          <Grille>
            {affiches.map((essai) => (
              <CarteEssai
                key={essai.id}
                essai={essai}
                maintenant={maintenant}
                aConfirmer={aConfirmer === essai.id}
                onOuvrir={() => router.push({ pathname: '/vetement', params: { essai: essai.id } })}
                onSupprimer={() => void supprimer(essai)}
              />
            ))}
          </Grille>
        </>
      )}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  filtres: { flexDirection: 'row', gap: Espace.s },
});
