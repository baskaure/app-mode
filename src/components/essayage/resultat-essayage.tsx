import { Platform, View, StyleSheet } from 'react-native';

import { PhotoCadree } from '@/components/essayage/photo-cadree';
import { ThemedText } from '@/components/themed-text';
import { ActionIcone, BarreActions, Bouton, Carte, ICONES, LienDiscret, Mention } from '@/components/ui';
import { Espace } from '@/constants/theme';
import type { LienAchat } from '@/lib/affiliation';

type Props = {
  url: string;
  aime: boolean | null;
  onAime: () => void;
  onAgrandir: () => void;
  onStory: () => void;
  enregistrement: 'en_cours' | 'fait' | null;
  onEnregistrer: () => void;
  conseil: { nom: string; objectif: string } | null;
  achat: LienAchat | null;
  onAcheter: () => void;
  onAutre: () => void;
};

// Le résultat : l'image, trois icônes (j'aime, story, enregistrer), le conseil, et une seule grosse action.
export function ResultatEssayage({ url, aime, onAime, onAgrandir, onStory, enregistrement, onEnregistrer, conseil, achat, onAcheter, onAutre }: Props) {
  return (
    <>
      <PhotoCadree uri={url} ia onPress={onAgrandir} label="Agrandir l’image" />

      <BarreActions>
        {aime !== null && (
          <ActionIcone nom={aime ? ICONES.aimeActif : ICONES.aime} label="J’aime" actif={aime} onPress={onAime} />
        )}
        {/* La story se crée sur téléphone (capture et menu de partage). */}
        {Platform.OS !== 'web' && <ActionIcone nom={ICONES.partager} label="Story" onPress={onStory} />}
        <ActionIcone
          nom={ICONES.telecharger}
          label={enregistrement === 'fait' ? 'Enregistrée' : 'Enregistrer'}
          actif={enregistrement === 'fait'}
          chargement={enregistrement === 'en_cours'}
          onPress={onEnregistrer}
        />
      </BarreActions>

      {conseil && (
        <Carte accent style={styles.conseil}>
          <ThemedText type="eyebrow">{conseil.nom}</ThemedText>
          <ThemedText>{conseil.objectif}</ThemedText>
        </Carte>
      )}

      {achat ? (
        <View style={styles.groupe}>
          <Bouton label="Voir l’article" onPress={onAcheter} />
          {achat.affilie && <Mention>Lien affilié : si tu achètes, nous touchons une petite commission, sans surcoût pour toi.</Mention>}
          <LienDiscret label="Essayer un autre vêtement" onPress={onAutre} />
        </View>
      ) : (
        <Bouton label="Essayer un autre vêtement" onPress={onAutre} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  conseil: { gap: Espace.s },
  groupe: { gap: Espace.s },
});
