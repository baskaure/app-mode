import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { PixelRatio, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { Chargement, Ecran, Etincelle, MessageErreur } from '@/components/ui';
import { Colors, Police } from '@/constants/theme';
import { lireSilhouette } from '@/lib/silhouette';

const AURA = require('@/assets/images/marque/aura-clair.png');
const SYMBOLE = require('@/assets/images/marque/symbole.png');
// Image produite : 1080 × 1920 px (story Instagram, TikTok, Snapchat).
const SORTIE = { largeur: 1080, hauteur: 1920 };
const C = Colors.light;

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

  // Toutes les tailles suivent la largeur de la carte : l'aperçu à l'écran et l'image produite sont identiques.
  const l = Math.min(width - 40, 380);
  const k = l / 360;
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
      <View
        ref={carte}
        collapsable={false}
        style={[styles.carte, { width: l, height: (l * 16) / 9, borderRadius: 22 * k }]}>
        <Image source={AURA} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={[styles.titre, { top: 64 * k, left: 26 * k, right: 46 * k }]}>
          <ThemedText style={[styles.texteTitre, { fontSize: 31 * k, lineHeight: 34 * k, letterSpacing: -1.2 * k, paddingHorizontal: 8 * k }]}>
            Je l’ai essayé avant de l’acheter
          </ThemedText>
        </View>
        <View style={[styles.duo, { top: 190 * k, left: 26 * k, right: 26 * k, gap: 10 * k }]}>
          {[
            { uri: photoSoi, etiquette: 'Avant', ia: false },
            { uri: url ?? null, etiquette: 'Sur moi', ia: true },
          ].map((p) => (
            <View key={p.etiquette} style={[styles.photo, { borderRadius: 16 * k }]}>
              {p.uri && (
                <Image
                  source={{ uri: p.uri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  onLoad={() => setChargees((n) => n + 1)}
                />
              )}
              {p.ia && (
                <View style={[styles.badge, { top: 8 * k, left: 8 * k, paddingHorizontal: 8 * k, paddingVertical: 3 * k, gap: 5 * k }]}>
                  <Etincelle taille={5 * k} couleur="#FFFFFF" />
                  <ThemedText style={[styles.texteBadge, { fontSize: 9.5 * k, lineHeight: 13 * k }]}>Créée par IA</ThemedText>
                </View>
              )}
              <View style={[styles.etiquette, { bottom: 8 * k, left: 8 * k, paddingHorizontal: 9 * k, paddingVertical: 2 * k }]}>
                <ThemedText style={[styles.texteEtiquette, { fontSize: 11 * k, lineHeight: 15 * k }]}>{p.etiquette}</ThemedText>
              </View>
            </View>
          ))}
        </View>
        <ThemedText style={[styles.legende, { top: 412 * k, left: 26 * k, right: 46 * k, fontSize: 14 * k, lineHeight: 19 * k }]}>
          Essayé sur ma propre photo, avec l’IA d’Akalie.
        </ThemedText>
        <View style={[styles.signature, { left: 26 * k, bottom: 92 * k, gap: 8 * k }]}>
          <Image source={SYMBOLE} style={{ width: 30 * k, height: 30 * k }} />
          <View>
            <ThemedText style={[styles.mot, { fontSize: 20 * k, lineHeight: 22 * k }]}>akalie</ThemedText>
            <ThemedText style={[styles.site, { fontSize: 11 * k, lineHeight: 14 * k }]}>akalie.app</ThemedText>
          </View>
        </View>
      </View>

      {!pretes && !erreur && <Chargement texte="Préparation de l’image…" />}
      <MessageErreur>{erreur}</MessageErreur>
      {Platform.OS === 'web' ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.centre}>
          Le partage se fait depuis l’app sur ton téléphone.
        </ThemedText>
      ) : (
        <Bouton label="Partager" desactive={!pretes} chargement={occupe} onPress={() => void partager()} />
      )}
      <ThemedText type="small" themeColor="textSecondary" style={styles.centre}>
        Ta photo n’est partagée que si tu choisis de la publier.
      </ThemedText>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  carte: { alignSelf: 'center', overflow: 'hidden', backgroundColor: C.background },
  titre: { position: 'absolute' },
  texteTitre: { fontFamily: Police.tresGras, color: C.text, backgroundColor: C.background, alignSelf: 'flex-start', borderRadius: 8 },
  duo: { position: 'absolute', flexDirection: 'row', aspectRatio: 308 / 205 },
  photo: { flex: 1, overflow: 'hidden', backgroundColor: C.border },
  badge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(11,11,15,0.62)',
  },
  texteBadge: { fontFamily: Police.demiGras, color: '#FFFFFF' },
  etiquette: { position: 'absolute', borderRadius: 999, backgroundColor: C.background },
  texteEtiquette: { fontFamily: Police.gras, color: C.text },
  legende: { position: 'absolute', fontFamily: Police.moyen, color: C.text },
  signature: { position: 'absolute', flexDirection: 'row', alignItems: 'center' },
  mot: { fontFamily: Police.gras, color: C.text, letterSpacing: -0.8 },
  site: { fontFamily: Police.moyen, color: C.textSecondary },
  centre: { textAlign: 'center' },
});
