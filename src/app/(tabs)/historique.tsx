import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Bouton, Pastille } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { BadgeIA, Carte, Chargement, Ecran, Etincelle, MessageErreur } from '@/components/ui';
import { Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { filtrerParAvis, type Filtre } from '@/lib/avis';
import { listerEssais, supprimerEssai, type EssaiHistorique } from '@/lib/historique';
import { dateCourte, libelleStatut, supprimable } from '@/lib/historique-regles';

// Onglet « Essayages » : les essayages passés, du plus récent au plus ancien. Toucher une carte rouvre l'essai
// (le résultat s'il est fait, sinon l'écran pour le lancer).
export default function Historique() {
  const theme = useTheme();
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
        <Carte accent style={styles.vide}>
          <ThemedText type="titreCarte">Rien pour l’instant</ThemedText>
          <ThemedText themeColor="textSecondary">
            Tes essayages apparaîtront ici. Choisis un vêtement pour commencer.
          </ThemedText>
          <Bouton label="Choisir un vêtement à essayer" onPress={() => router.push('/vetement')} />
        </Carte>
      ) : (
        <>
          <View style={styles.filtres}>
            <Pastille label="Tous" selectionne={filtre === 'tous'} onPress={() => setFiltre('tous')} />
            <Pastille label="J’aime" selectionne={filtre === 'aime'} onPress={() => setFiltre('aime')} />
          </View>
          {affiches.length === 0 && (
            <ThemedText themeColor="textSecondary">
              Aucun essayage aimé pour l’instant. Touche « J’aime » sous un résultat.
            </ThemedText>
          )}
          <View style={styles.grille}>
            {affiches.map((essai) => {
              const image = essai.urlResultat ?? essai.urlVetement;
              const confirmer = aConfirmer === essai.id;
              return (
                <View key={essai.id} style={[styles.carte, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Ouvrir l’essayage : ${libelleStatut(essai.statut)}`}
                    onPress={() => router.push({ pathname: '/vetement', params: { essai: essai.id } })}
                    style={({ pressed }) => pressed && { opacity: 0.85 }}>
                    {image ? (
                      <Image source={{ uri: image }} style={styles.photo} contentFit="cover" />
                    ) : (
                      <View style={[styles.photo, { backgroundColor: theme.backgroundSelected }]} />
                    )}
                    {essai.urlResultat && <BadgeIA />}
                    {essai.avis === 'aime' && (
                      <View
                        style={[styles.coeur, { backgroundColor: theme.backgroundElement }]}
                        accessible
                        accessibilityLabel="J’aime">
                        <Etincelle taille={9} />
                      </View>
                    )}
                    <View style={styles.legende}>
                      <ThemedText type="smallBold">
                        {libelleStatut(essai.statut)}
                        {essai.avis === 'aime_pas' ? ' · J’aime pas' : ''}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {dateCourte(essai.created_at, maintenant)}
                      </ThemedText>
                    </View>
                  </Pressable>
                  {supprimable(essai) && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Supprimer cet essayage"
                      onPress={() => void supprimer(essai)}
                      style={[styles.supprimer, confirmer && { backgroundColor: theme.erreurFond }]}>
                      <ThemedText
                        type={confirmer ? 'smallBold' : 'small'}
                        style={{ color: confirmer ? theme.erreur : theme.textSecondary }}>
                        {confirmer ? 'Toucher encore pour supprimer' : 'Supprimer'}
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </>
      )}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  vide: { paddingVertical: 28 },
  filtres: { flexDirection: 'row', gap: 8 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  carte: { width: '48%', flexGrow: 1, maxWidth: '48.5%', borderRadius: Rayon.moyen, borderWidth: 1, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 3 / 4 },
  coeur: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legende: { paddingHorizontal: 12, paddingTop: 10, gap: 1 },
  supprimer: { paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
});
