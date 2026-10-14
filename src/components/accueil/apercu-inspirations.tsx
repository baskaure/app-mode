import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { CarteArticle } from '@/components/catalogue/carte-article';
import { LienDiscret, Section } from '@/components/ui';
import { Espace, Gouttiere } from '@/constants/theme';
import type { Recommandation } from '@/lib/catalogue-regles';
import type { Piece } from '@/lib/dressing';

// Une rangée de vrais articles du catalogue, et le lien vers l'onglet Inspirations.
export function ApercuInspirations({ recos, pieces }: { recos: Recommandation[]; pieces: Piece[] }) {
  const parId = new Map(pieces.map((p) => [p.id, p]));
  return (
    <Section titre="Pour toi" detail="De vrais articles choisis pour ton style et ton dressing.">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangee}>
        {recos.map((r) => (
          <CarteArticle key={r.article.id} reco={r} piece={r.pieceId ? parId.get(r.pieceId) : null} largeur={156} />
        ))}
      </ScrollView>
      <LienDiscret label="Voir toutes les inspirations" onPress={() => router.push('/inspirations')} />
    </Section>
  );
}

const styles = StyleSheet.create({
  rangee: { gap: Espace.m, paddingRight: Gouttiere },
});
