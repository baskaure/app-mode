import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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

  return (
    <ThemedView style={styles.fond}>
      <SafeAreaView style={styles.zone}>
        <ScrollView contentContainerStyle={styles.contenu}>
          <ThemedText type="subtitle">Tes essayages</ThemedText>
          {erreur && (
            <ThemedText type="small" style={styles.erreur}>
              {erreur}
            </ThemedText>
          )}

          {chargement ? (
            <ActivityIndicator />
          ) : essais.length === 0 ? (
            <>
              <ThemedText themeColor="textSecondary">
                Tes essayages apparaîtront ici. Choisis un vêtement pour commencer.
              </ThemedText>
              <Bouton label="Choisir un vêtement à essayer" onPress={() => router.push('/vetement')} />
            </>
          ) : (
            <View style={styles.grille}>
              {essais.map((essai) => {
                const image = essai.urlResultat ?? essai.urlVetement;
                return (
                  <View key={essai.id} style={[styles.carte, { backgroundColor: theme.backgroundElement }]}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Ouvrir l’essayage : ${libelleStatut(essai.statut)}`}
                      onPress={() => router.push({ pathname: '/vetement', params: { essai: essai.id } })}>
                      {image ? (
                        <Image source={{ uri: image }} style={styles.photo} contentFit="cover" />
                      ) : (
                        <View style={styles.photo} />
                      )}
                      <View style={styles.legende}>
                        <ThemedText type="smallBold">{libelleStatut(essai.statut)}</ThemedText>
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
                        style={styles.supprimer}>
                        <ThemedText
                          type={aConfirmer === essai.id ? 'smallBold' : 'small'}
                          themeColor={aConfirmer === essai.id ? 'text' : 'textSecondary'}>
                          {aConfirmer === essai.id ? 'Toucher encore pour supprimer' : 'Supprimer'}
                        </ThemedText>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  contenu: { padding: Spacing.four, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.four },
  erreur: { color: '#D93025' },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  carte: { width: '48%', borderRadius: 14, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 3 / 4 },
  legende: { paddingHorizontal: Spacing.two, paddingTop: Spacing.two, gap: 2 },
  supprimer: { padding: Spacing.two, alignItems: 'center' },
});
