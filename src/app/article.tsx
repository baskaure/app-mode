import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PhotoCadree } from '@/components/essayage/photo-cadree';
import { ThemedText } from '@/components/themed-text';
import { Bouton, Carte, Chargement, Ecran, LienDiscret, MessageErreur, Surtitre } from '@/components/ui';
import { Espace } from '@/constants/theme';
import { ouvrirAchat } from '@/lib/achat';
import { lireArticle } from '@/lib/catalogue';
import { prixAffiche, type Article } from '@/lib/catalogue-regles';
import { essaiDepuisArticle } from '@/lib/essais';
import { noter } from '@/lib/mesure';

// Fiche d'un article du catalogue, ouverte avec `?id=<article>&raison=<pourquoi il est proposé>`.
export default function FicheArticle() {
  const { id, raison } = useLocalSearchParams<{ id?: string; raison?: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let annule = false;
    lireArticle(id)
      .then((a) => {
        if (annule) return;
        setArticle(a);
        if (a) noter('article_ouvert');
        else setErreur('Cet article n’est plus disponible.');
      })
      .catch((e: unknown) => !annule && setErreur(e instanceof Error ? e.message : String(e)))
      .finally(() => !annule && setChargement(false));
    return () => {
      annule = true;
    };
  }, [id]);

  const essayer = async () => {
    if (!article) return;
    setOccupe(true);
    setErreur(null);
    try {
      const essai = await essaiDepuisArticle(article.id);
      router.replace({ pathname: '/vetement', params: { essai } });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe(false);
    }
  };

  if (chargement || !article) {
    return (
      <Ecran fermable centre>
        {chargement ? <Chargement /> : <MessageErreur>{erreur}</MessageErreur>}
      </Ecran>
    );
  }

  const prix = prixAffiche(article);
  return (
    <Ecran fermable>
      <PhotoCadree uri={article.image_url} remplir />
      <View style={styles.titres}>
        <ThemedText type="eyebrow">{article.marque ?? article.marchand}</ThemedText>
        <ThemedText type="subtitle">{article.nom}</ThemedText>
        {prix && <ThemedText type="titreCarte">{prix}</ThemedText>}
      </View>
      {raison ? (
        <Carte accent style={styles.raison}>
          <Surtitre>Pourquoi pour toi</Surtitre>
          <ThemedText>{raison}</ThemedText>
        </Carte>
      ) : null}
      <MessageErreur>{erreur}</MessageErreur>
      <View style={styles.actions}>
        <Bouton label="M’essayer cet article" chargement={occupe} onPress={() => void essayer()} />
        {!occupe && (
          <LienDiscret
            label={article.source === 'web' ? 'Voir les offres' : `Voir sur ${article.marchand}`}
            onPress={() => void ouvrirAchat(article.lien)}
          />
        )}
      </View>
      {article.source === 'web' && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          Trouvé sur le web chez {article.marchand}. Prix et disponibilité à vérifier sur le site du vendeur.
        </ThemedText>
      )}
      {article.source === 'awin' && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          Lien affilié : si tu achètes, nous touchons une petite commission, sans surcoût pour toi.
        </ThemedText>
      )}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  titres: { gap: Espace.s },
  raison: { gap: Espace.s },
  actions: { gap: Espace.s },
  note: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
