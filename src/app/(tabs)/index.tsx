import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { conseilPour } from '@/lib/morphologie';
import { lireSilhouette, supprimerSilhouette, type Silhouette } from '@/lib/silhouette';
import { useProfil } from '@/state/profil';

// Onglet principal : la photo de soi, puis (étape suivante du BRIEF) le vêtement à essayer.
export default function Essayer() {
  const { profil } = useProfil();
  const conseil = profil.silhouette ? conseilPour(profil.silhouette, profil.vestiaire ?? 'femme') : null;
  const [silhouette, setSilhouette] = useState<Silhouette | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Relit la photo à chaque retour sur l'onglet (par exemple après l'écran photo-soi).
  useFocusEffect(
    useCallback(() => {
      let annule = false;
      lireSilhouette()
        .then((s) => !annule && setSilhouette(s))
        .catch((e: unknown) => !annule && setErreur(e instanceof Error ? e.message : String(e)))
        .finally(() => !annule && setChargement(false));
      return () => {
        annule = true;
      };
    }, []),
  );

  const supprimer = async () => {
    try {
      await supprimerSilhouette();
      setSilhouette(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <ThemedView style={styles.fond}>
      <SafeAreaView style={styles.zone}>
        <ScrollView contentContainerStyle={styles.contenu}>
          <ThemedText type="subtitle">Essayer</ThemedText>
          {conseil && (
            <ThemedText themeColor="textSecondary">
              {conseil.nom} · {conseil.objectif}
            </ThemedText>
          )}

          {chargement ? (
            <ActivityIndicator />
          ) : silhouette ? (
            <>
              {silhouette.url && (
                <Image source={{ uri: silhouette.url }} style={styles.photo} contentFit="contain" />
              )}
              <Bouton label="Choisir un vêtement à essayer" desactive onPress={() => {}} />
              <ThemedText type="small" themeColor="textSecondary">
                Bientôt : partage un article, colle un lien ou envoie la photo d’un vêtement.
              </ThemedText>
              <Bouton label="Changer ma photo" onPress={() => router.push('/photo-soi')} />
              <Bouton label="Supprimer ma photo" onPress={() => void supprimer()} />
            </>
          ) : (
            <>
              <ThemedText>Pour t’essayer des vêtements, ajoute d’abord une photo de toi en pied.</ThemedText>
              <Bouton label="Ajouter ma photo" onPress={() => router.push('/photo-soi')} />
            </>
          )}

          {erreur && (
            <ThemedText type="small" style={styles.erreur}>
              {erreur}
            </ThemedText>
          )}
          <Bouton label="Voir l’offre complète" onPress={() => router.push('/paywall')} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  contenu: { padding: Spacing.four, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.four },
  photo: { width: '100%', aspectRatio: 3 / 4, borderRadius: 14 },
  erreur: { color: '#D93025' },
});
