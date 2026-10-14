import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { PhotoCadree } from '@/components/essayage/photo-cadree';
import { ActionIcone, ActionsSurPhoto, Bouton, Carte, EtatVide, Etiquette, ICONES } from '@/components/ui';
import { Espace } from '@/constants/theme';
import type { Silhouette } from '@/lib/silhouette';

// La photo de soi (point de départ de chaque essayage) et l'action principale de l'app : choisir un vêtement.
// Sans photo : on invite à l'ajouter.
export function CartePhotoSoi({ silhouette, onSupprimer }: { silhouette: Silhouette | null; onSupprimer: () => void }) {
  if (!silhouette) {
    return (
      <EtatVide
        titre="Commence par ta photo"
        texte="Une photo de toi en pied, de face. Akalie t’habille avec les vêtements que tu veux essayer."
        action={{ label: 'Ajouter ma photo', onPress: () => router.push('/photo-soi') }}
      />
    );
  }
  return (
    <Carte style={styles.carte}>
      <PhotoCadree uri={silhouette.url} remplir>
        <Etiquette texte="Ta photo" surPhoto />
        <ActionsSurPhoto>
          <ActionIcone nom={ICONES.changer} label="Changer ma photo" surPhoto onPress={() => router.push('/photo-soi')} />
          <ActionIcone nom={ICONES.supprimer} label="Supprimer ma photo" surPhoto onPress={onSupprimer} />
        </ActionsSurPhoto>
      </PhotoCadree>
      <Bouton label="Choisir un vêtement à essayer" onPress={() => router.push('/vetement')} />
    </Carte>
  );
}

const styles = StyleSheet.create({
  carte: { padding: Espace.m, gap: Espace.m },
});
