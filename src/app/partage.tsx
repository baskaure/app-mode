import { router } from 'expo-router';
import { useIncomingShare } from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { essaiDepuisLien, essaiDepuisPhoto } from '@/lib/essais';
import { fermer } from '@/lib/navigation';
import { etapePartage, lirePartage } from '@/lib/partage';
import { useProfil } from '@/state/profil';

// Reçoit ce que l'utilisateur partage depuis une autre app (capture d'écran, photo, lien d'article),
// en fait un essai, puis ouvre l'écran vêtement sur cet essai.
// Sur le web, useIncomingShare lève « Receiving share payloads is not supported on web » (testé le 12 oct. 2026,
// la doc dit pourtant Web) : on n'appelle donc le hook que sur téléphone.
const DELAI_RESOLUTION_MS = 8000;

export default function Partage() {
  return Platform.OS === 'web' ? <Ecran vide /> : <RecevoirPartage />;
}

function RecevoirPartage() {
  const { pret } = useProfil();
  const { sharedPayloads, resolvedSharedPayloads, isResolving, error, clearSharedPayloads } = useIncomingShare();
  const [erreur, setErreur] = useState<string | null>(null);
  const [vide, setVide] = useState(false);
  const [delaiPasse, setDelaiPasse] = useState(false);
  const traite = useRef(false);

  // Filet de sécurité : si la résolution ne répond pas, on traite les charges brutes 8 s après que la session
  // est prête (à froid sur un réseau lent, la connexion anonyme ne mange pas le délai).
  useEffect(() => {
    if (!pret) return;
    const minuteur = setTimeout(() => setDelaiPasse(true), DELAI_RESOLUTION_MS);
    return () => clearTimeout(minuteur);
  }, [pret]);

  useEffect(() => {
    if (traite.current) return;
    const etape = etapePartage({
      pret,
      nbBrutes: sharedPayloads.length,
      nbResolues: resolvedSharedPayloads.length,
      isResolving,
      erreur: error !== null,
      delaiPasse,
    });
    if (etape === 'attendre') return;
    traite.current = true;
    // Les charges résolues donnent la copie locale de l'image (Android : file:// au lieu de content://).
    const partage = etape === 'vide' ? null : lirePartage(etape === 'resolues' ? resolvedSharedPayloads : sharedPayloads);

    void (async () => {
      if (!partage || partage.type === 'rien') {
        setVide(true);
        return;
      }
      try {
        const id =
          partage.type === 'image'
            ? await essaiDepuisPhoto({ uri: partage.uri, width: 0, height: 0 })
            : await essaiDepuisLien(partage.url);
        clearSharedPayloads();
        router.replace({ pathname: '/vetement', params: { essai: id } });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setErreur(
          partage.type === 'lien'
            ? `${message} Astuce : fais une capture d’écran de l’article et partage-la à l’app.`
            : message,
        );
      }
    })();
  }, [pret, isResolving, error, delaiPasse, resolvedSharedPayloads, sharedPayloads, clearSharedPayloads]);

  return <Ecran vide={vide} erreur={erreur} />;
}

function Ecran({ vide = false, erreur = null }: { vide?: boolean; erreur?: string | null }) {
  return (
    <ThemedView style={styles.fond}>
      <SafeAreaView style={styles.zone}>
        {erreur || vide ? (
          <>
            <ThemedText type="subtitle">{vide ? 'Rien à essayer' : 'Impossible d’utiliser ce partage'}</ThemedText>
            <ThemedText>
              {vide
                ? 'Partage une capture d’écran, une photo ou le lien d’un vêtement depuis une autre app.'
                : erreur}
            </ThemedText>
            <Bouton label="Choisir le vêtement autrement" onPress={() => router.replace('/vetement')} />
            <Bouton label="Fermer" onPress={() => fermer()} />
          </>
        ) : (
          <>
            <ActivityIndicator size="large" />
            <ThemedText style={styles.centre}>Préparation du vêtement…</ThemedText>
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
    justifyContent: 'center',
  },
  centre: { textAlign: 'center' },
});
