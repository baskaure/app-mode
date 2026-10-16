import { Image } from 'expo-image';
import type { Ref } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Police } from '@/constants/theme';

const AURA = require('@/assets/images/marque/aura-clair.png');
const SYMBOLE = require('@/assets/images/marque/symbole.png');
const C = Colors.light;

type Props = {
  ref: Ref<View>;
  /** Largeur à l'écran ; tout le reste en découle (la carte est dessinée pour 360 de large, format 9:16). */
  largeur: number;
  photoSoi: string | null;
  resultat: string | null;
  onImageChargee: () => void;
};

// La story « avant / après » (9:16). Toujours aux couleurs claires de la marque, comme les visuels de la charte.
// Les cotes sont celles de la charte (zone sûre TikTok / Instagram : rien à droite ni tout en bas).
export function StoryAvantApres({ ref, largeur, photoSoi, resultat, onImageChargee }: Props) {
  const l = largeur;
  const k = l / 360;
  return (
      <View
        ref={ref}
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
            { uri: resultat, etiquette: 'Sur moi', ia: true },
          ].map((p) => (
            <View key={p.etiquette} style={[styles.photo, { borderRadius: 16 * k }]}>
              {p.uri && (
                <Image
                  source={{ uri: p.uri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  onLoad={onImageChargee}
                />
              )}
              {p.ia && (
                <View style={[styles.badge, { top: 8 * k, left: 8 * k, paddingHorizontal: 8 * k, paddingVertical: 3 * k, gap: 5 * k }]}>
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
});
