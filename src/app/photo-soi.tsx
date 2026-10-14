import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { Carte, CaseACocher, Ecran, ICONES, MessageErreur, Puce, RangeeTuiles, TuileAction } from '@/components/ui';
import { Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { choisirPhoto, type Photo, type Source } from '@/lib/photos';
import { enregistrerSilhouette, verifierCadrage } from '@/lib/silhouette';
import { fermer } from '@/lib/navigation';

const CONSEILS = [
  'De la tête aux pieds, de face, bras légèrement écartés.',
  'Face à une fenêtre, à la lumière du jour.',
  'Devant un mur uni, sans personne d’autre sur la photo.',
  'Avec des vêtements près du corps : l’IA voit mieux ta silhouette.',
];

export default function PhotoSoi() {
  const theme = useTheme();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [consentement, setConsentement] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const prendre = async (source: Source) => {
    setErreur(null);
    try {
      const choisie = await choisirPhoto(source);
      if (!choisie) return;
      const probleme = verifierCadrage(choisie);
      if (probleme) {
        setErreur(probleme);
        return;
      }
      setPhoto(choisie);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  };

  const valider = async () => {
    if (!photo || !consentement) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await enregistrerSilhouette(photo);
      fermer();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Ecran fermable eyebrow="Ta photo" titre="Ta photo pour l’essayage">
      {photo ? (
        <View style={[styles.cadre, { backgroundColor: theme.backgroundElement }]}>
          <Image source={{ uri: photo.uri }} style={styles.apercu} contentFit="contain" />
        </View>
      ) : (
        <Carte>
          <ThemedText type="titreCarte">Pour un bon résultat</ThemedText>
          <View style={styles.liste}>
            {CONSEILS.map((c) => (
              <Puce key={c}>{c}</Puce>
            ))}
          </View>
        </Carte>
      )}

      <RangeeTuiles>
        <TuileAction nom={ICONES.photo} label={photo ? 'Reprendre' : 'Photo'} desactive={envoi} onPress={() => void prendre('camera')} />
        <TuileAction nom={ICONES.galerie} label="Galerie" desactive={envoi} onPress={() => void prendre('galerie')} />
      </RangeeTuiles>

      {photo && (
        <CaseACocher coche={consentement} onPress={() => setConsentement((c) => !c)}>
          <ThemedText type="small">
            C’est bien moi sur la photo, et j’ai 15 ans ou plus. Ma photo reste privée et sert uniquement à mes
            essayages. Pour chaque essayage, elle est vérifiée automatiquement (Anthropic, États-Unis) puis envoyée à
            nos prestataires d’IA (Kie.ai, puis OpenAI aux États-Unis), donc hors de l’Union européenne. Je peux la
            supprimer quand je veux.
          </ThemedText>
        </CaseACocher>
      )}

      {photo && (
        <Bouton label="Utiliser cette photo" desactive={!consentement} chargement={envoi} onPress={() => void valider()} />
      )}

      <MessageErreur>{erreur}</MessageErreur>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  liste: { gap: 10 },
  cadre: { borderRadius: Rayon.grand, overflow: 'hidden' },
  apercu: { width: '100%', aspectRatio: 3 / 4 },
});
