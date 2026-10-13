import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { conseilPour } from '@/lib/morphologie';
import { lireSilhouette, supprimerSilhouette, type Silhouette } from '@/lib/silhouette';
import { suggestions, touche } from '@/lib/suggestions';
import { useProfil } from '@/state/profil';

// Onglet principal : la photo de soi, puis (étape suivante du BRIEF) le vêtement à essayer.
export default function Essayer() {
  const { profil } = useProfil();
  const theme = useTheme();
  const conseil = profil.silhouette ? conseilPour(profil.silhouette, profil.vestiaire ?? 'femme') : null;
  // Idées de pièces (version rapide, sans catalogue) : règles de la silhouette + mot-clé du style.
  const idees =
    conseil && profil.style ? suggestions(conseil.aPrivilegier, profil.style, profil.vestiaire ?? 'femme') : [];
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
              <Bouton label="Choisir un vêtement à essayer" onPress={() => router.push('/vetement')} />
              <Bouton label="Changer ma photo" onPress={() => router.push('/photo-soi')} />
              <Bouton label="Supprimer ma photo" onPress={() => void supprimer()} />
            </>
          ) : (
            <>
              <ThemedText>Pour t’essayer des vêtements, ajoute d’abord une photo de toi en pied.</ThemedText>
              <Bouton label="Ajouter ma photo" onPress={() => router.push('/photo-soi')} />
            </>
          )}

          {idees.length > 0 && profil.style && (
            <View style={styles.idees}>
              <ThemedText type="smallBold">Idées pour toi</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Choisies pour ta silhouette et ton style ({touche(profil.style)}). Trouve un article, puis partage-le
                vers l’app, ou fais une capture et choisis-la pour l’essayer.
              </ThemedText>
              {idees.map((idee) => (
                <View key={idee.piece} style={[styles.idee, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText style={styles.ideeNom}>{idee.piece}</ThemedText>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`Chercher ${idee.piece} sur Vinted`}
                    onPress={() => void Linking.openURL(idee.vinted)}
                    style={[styles.lien, { borderColor: theme.textSecondary }]}>
                    <ThemedText type="small">Vinted</ThemedText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`Chercher ${idee.piece} sur Google Shopping`}
                    onPress={() => void Linking.openURL(idee.google)}
                    style={[styles.lien, { borderColor: theme.textSecondary }]}>
                    <ThemedText type="small">Google</ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {erreur && (
            <ThemedText type="small" style={styles.erreur}>
              {erreur}
            </ThemedText>
          )}
          <Bouton label="Voir l’offre complète" onPress={() => router.push('/paywall')} />
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.lienDiscret}
            accessibilityRole="button"
            onPress={() => router.push('/supprimer-donnees')}>
            Supprimer toutes mes données
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  contenu: { padding: Spacing.four, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.four },
  lienDiscret: { textAlign: 'center', textDecorationLine: 'underline', paddingVertical: Spacing.two },
  photo: { width: '100%', aspectRatio: 3 / 4, borderRadius: 14 },
  erreur: { color: '#D93025' },
  idees: { gap: Spacing.two },
  idee: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: 14 },
  ideeNom: { flex: 1 },
  lien: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 10, borderWidth: 1 },
});
