import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { PixelRatio, Platform, useWindowDimensions, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { StoryAvantApres } from '@/components/partage/story-avant-apres';
import { Bouton, Chargement, Ecran, Mention, MessageErreur } from '@/components/ui';
import { Gouttiere } from '@/constants/theme';
import { lireSilhouette } from '@/lib/silhouette';

// Image produite : 1080 × 1920 px (story Instagram, TikTok, Snapchat).
const SORTIE = { largeur: 1080, hauteur: 1920 };

// Story « avant / après » à partager, ouverte depuis le résultat avec `?url=<résultat signé>`.
// La carte garde toujours les couleurs claires de la marque (comme les visuels de la charte), quel que soit le thème.
export default function Partager() {
  const { url } = useLocalSearchParams<{ url?: string }>();
  const { width } = useWindowDimensions();
  const carte = useRef<View>(null);
  const [photoSoi, setPhotoSoi] = useState<string | null>(null);
  const [chargees, setChargees] = useState(0);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    lireSilhouette()
      .then((s) => {
        if (annule) return;
        if (s?.url) setPhotoSoi(s.url);
        // Photo de soi supprimée entre-temps : sans elle, pas d'« avant ».
        else setErreur('Ta photo de départ n’est plus là : ajoute-la dans l’onglet Essayer pour créer la story.');
      })
      .catch((e: unknown) => !annule && setErreur(e instanceof Error ? e.message : String(e)));
    return () => {
      annule = true;
    };
  }, []);

  const pretes = !!url && !!photoSoi && chargees >= 2;

  const partager = async () => {
    if (!carte.current) return;
    setOccupe(true);
    setErreur(null);
    try {
      const fichier = await captureRef(carte, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: SORTIE.largeur / PixelRatio.get(),
        height: SORTIE.hauteur / PixelRatio.get(),
      });
      if (!(await Sharing.isAvailableAsync())) throw new Error('Le partage n’est pas disponible sur cet appareil.');
      await Sharing.shareAsync(fichier, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Partager ton essayage' });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe(false);
    }
  };

  return (
    <Ecran fermable eyebrow="Partager" titre="Ta story avant / après">
      <StoryAvantApres
        ref={carte}
        largeur={Math.min(width - 2 * Gouttiere, 380)}
        photoSoi={photoSoi}
        resultat={url ?? null}
        onImageChargee={() => setChargees((n) => n + 1)}
      />

      {!pretes && !erreur && <Chargement texte="Préparation de l’image…" />}
      <MessageErreur>{erreur}</MessageErreur>
      {Platform.OS === 'web' ? (
        <Mention>Le partage se fait depuis l’app sur ton téléphone.</Mention>
      ) : (
        <Bouton label="Partager" desactive={!pretes} chargement={occupe} onPress={() => void partager()} />
      )}
      <Mention>Ta photo n’est partagée que si tu choisis de la publier.</Mention>
    </Ecran>
  );
}
