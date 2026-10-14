import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { Carte, Chargement, Ecran, LienDiscret, MessageErreur, SurtitreEtincelle } from '@/components/ui';
import { Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ouvrirAchat } from '@/lib/achat';
import { lireArticle } from '@/lib/catalogue';
import { prixAffiche, type Article } from '@/lib/catalogue-regles';
import { essaiDepuisArticle } from '@/lib/essais';

// Fiche d'un article du catalogue, ouverte avec `?id=<article>&raison=<pourquoi il est proposé>`.
export default function FicheArticle() {
  const theme = useTheme();
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
        if (!a) setErreur('Cet article n’est plus disponible.');
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
      <View style={[styles.cadre, { backgroundColor: theme.backgroundElement }]}>
        <Image source={{ uri: article.image_url }} style={styles.photo} contentFit="cover" transition={150} />
      </View>
      <View style={styles.titres}>
        <ThemedText type="eyebrow">{article.marque ?? article.marchand}</ThemedText>
        <ThemedText type="subtitle">{article.nom}</ThemedText>
        {prix && <ThemedText type="titreCarte">{prix}</ThemedText>}
      </View>
      {raison ? (
        <Carte accent style={styles.raison}>
          <SurtitreEtincelle>Pourquoi pour toi</SurtitreEtincelle>
          <ThemedText>{raison}</ThemedText>
        </Carte>
      ) : null}
      <MessageErreur>{erreur}</MessageErreur>
      <View style={styles.actions}>
        <Bouton label="M’essayer cet article" chargement={occupe} onPress={() => void essayer()} />
        {!occupe && <LienDiscret label={`Voir sur ${article.marchand}`} onPress={() => void ouvrirAchat(article.lien)} />}
      </View>
      {article.source === 'awin' && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          Lien affilié : si tu achètes, nous touchons une petite commission, sans surcoût pour toi.
        </ThemedText>
      )}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  cadre: { borderRadius: Rayon.grand, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 3 / 4 },
  titres: { gap: 6 },
  raison: { gap: 8 },
  actions: { gap: 10 },
  note: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
