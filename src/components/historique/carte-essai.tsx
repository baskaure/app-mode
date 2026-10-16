import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ActionIcone, CarteVignette, ICONES, Icone } from '@/components/ui';
import { Espace } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { EssaiHistorique } from '@/lib/historique';
import { dateCourte, libelleStatut, supprimable } from '@/lib/historique-regles';

type Props = {
  essai: EssaiHistorique;
  maintenant: Date;
  /** Premier appui sur la poubelle fait : le prochain supprime. */
  aConfirmer: boolean;
  onOuvrir: () => void;
  onSupprimer: () => void;
};

// Un essayage passé : l'image (résultat, sinon le vêtement), son état, sa date, et la poubelle en deux temps.
export function CarteEssai({ essai, maintenant, aConfirmer, onOuvrir, onSupprimer }: Props) {
  const theme = useTheme();
  return (
    <CarteVignette
      uri={essai.urlResultat ?? essai.urlVetement}
      label={`Ouvrir l’essayage : ${libelleStatut(essai.statut)}`}
      onPress={onOuvrir}
      ia={!!essai.urlResultat}
      surPhoto={
        essai.avis === 'aime' && (
          <View style={[styles.coeur, { backgroundColor: theme.backgroundElement }]} accessible accessibilityLabel="J’aime">
            <Icone nom={ICONES.aimeActif} taille={14} couleur={theme.accent} />
          </View>
        )
      }
      action={
        supprimable(essai) && (
          <ActionIcone
            nom={ICONES.supprimer}
            label={aConfirmer ? 'Toucher encore pour supprimer' : 'Supprimer cet essayage'}
            surPhoto
            danger={aConfirmer}
            onPress={onSupprimer}
          />
        )
      }>
      <ThemedText type="smallBold">
        {libelleStatut(essai.statut)}
        {essai.avis === 'aime_pas' ? ' · J’aime pas' : ''}
      </ThemedText>
      <ThemedText type="small" themeColor={aConfirmer ? undefined : 'textSecondary'} style={aConfirmer && { color: theme.erreur }}>
        {aConfirmer ? 'Toucher encore pour supprimer' : dateCourte(essai.created_at, maintenant)}
      </ThemedText>
    </CarteVignette>
  );
}

const styles = StyleSheet.create({
  coeur: {
    position: 'absolute',
    top: Espace.m,
    right: Espace.m,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
