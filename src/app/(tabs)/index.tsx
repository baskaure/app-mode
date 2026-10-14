import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CarteArticle } from '@/components/carte-article';
import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { Carte, Chargement, Ecran, Logo, MessageErreur, Section, SurtitreEtincelle } from '@/components/ui';
import { Rayon, Spacing } from '@/constants/theme';
import { useInspirations } from '@/hooks/use-inspirations';
import { useTheme } from '@/hooks/use-theme';
import { conseilPour } from '@/lib/morphologie';
import { lireSilhouette, supprimerSilhouette, type Silhouette } from '@/lib/silhouette';
import { suggestions, touche } from '@/lib/suggestions';
import { useProfil } from '@/state/profil';

// Onglet principal : la photo de soi, puis le vêtement à essayer.
export default function Essayer() {
  const { profil } = useProfil();
  const theme = useTheme();
  const conseil = profil.silhouette ? conseilPour(profil.silhouette, profil.vestiaire ?? 'femme') : null;
  // Idées de pièces (version rapide, sans catalogue) : règles de la silhouette + mot-clé du style.
  const idees =
    conseil && profil.style ? suggestions(conseil.aPrivilegier, profil.style, profil.vestiaire ?? 'femme') : [];
  // Catalogue : ce qui va avec le dressing d'abord, puis le style ; sans article visible, on garde les idées de recherche.
  const inspirations = useInspirations();
  const vus = new Set<string>();
  const apercu = [...inspirations.avecDressing, ...inspirations.pourStyle]
    .filter((r) => !vus.has(r.article.id) && vus.add(r.article.id))
    .slice(0, 8);
  const piecesParId = new Map(inspirations.pieces.map((p) => [p.id, p]));
  const [silhouette, setSilhouette] = useState<Silhouette | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Relit la photo à chaque retour sur l'onglet (par exemple après l'écran photo-soi).
  useFocusEffect(
    useCallback(() => {
      let annule = false;
      lireSilhouette()
        .then((s) => !annule && setSilhouette(s))
        .catch((e: unknown) => !annule && setErreur(e instanceof Error ? e.message : String(e)))
        .finally(() => !annule && setChargement(false));
      return () => {
        annule = true;
      };
    }, []),
  );

  const supprimer = async () => {
    try {
      await supprimerSilhouette();
      setSilhouette(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Ecran onglet enTete={<Logo />}>
      <View style={styles.titres}>
        <ThemedText type="title">Essaie avant{'\n'}d’acheter.</ThemedText>
        {conseil && (
          <View style={[styles.morpho, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold">{conseil.nom}</ThemedText>
          </View>
        )}
      </View>

      {chargement ? (
        <Chargement />
      ) : silhouette ? (
        <Carte style={styles.carteSoi}>
          {silhouette.url && (
            <View style={styles.cadrePhoto}>
              <Image source={{ uri: silhouette.url }} style={styles.photo} contentFit="cover" />
              <View style={[styles.etiquette, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Ta photo</ThemedText>
              </View>
            </View>
          )}
          <Bouton label="Choisir un vêtement à essayer" onPress={() => router.push('/vetement')} />
          <View style={styles.rangee}>
            <View style={styles.moitie}>
              <Bouton variante="secondaire" label="Changer" onPress={() => router.push('/photo-soi')} />
            </View>
            <View style={styles.moitie}>
              <Bouton variante="secondaire" label="Supprimer" onPress={() => void supprimer()} />
            </View>
          </View>
        </Carte>
      ) : (
        <Carte accent style={styles.carteVide}>
          <ThemedText type="titreCarte">Commence par ta photo</ThemedText>
          <ThemedText themeColor="textSecondary">
            Une photo de toi en pied, de face. Akalie t’habille avec les vêtements que tu veux essayer.
          </ThemedText>
          <Bouton label="Ajouter ma photo" onPress={() => router.push('/photo-soi')} />
        </Carte>
      )}

      <MessageErreur>{erreur}</MessageErreur>

      {apercu.length > 0 ? (
        <Section titre="Pour toi" detail="De vrais articles choisis pour ton style et ton dressing.">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeeArticles}>
            {apercu.map((r) => (
              <CarteArticle key={r.article.id} reco={r} piece={r.pieceId ? piecesParId.get(r.pieceId) : null} largeur={156} />
            ))}
          </ScrollView>
          <Bouton variante="secondaire" label="Voir toutes les inspirations" onPress={() => router.push('/inspirations')} />
        </Section>
      ) : idees.length > 0 && profil.style && (
        <Section
          titre="Idées pour toi"
          detail={`Pour ta silhouette et ton style (${touche(profil.style)}). Trouve un article, puis partage-le vers l’app, ou fais une capture et choisis-la pour l’essayer.`}>
          <View style={styles.idees}>
            {idees.map((idee) => (
              <View
                key={idee.piece}
                style={[styles.idee, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <ThemedText style={styles.ideeNom}>{idee.piece}</ThemedText>
                <Lien label="Vinted" a11y={`Chercher ${idee.piece} sur Vinted`} url={idee.vinted} />
                <Lien label="Google" a11y={`Chercher ${idee.piece} sur Google Shopping`} url={idee.google} />
              </View>
            ))}
          </View>
        </Section>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/paywall')}
        style={({ pressed }) => [styles.offre, { backgroundColor: theme.text }, pressed && { opacity: 0.85 }]}>
        <SurtitreEtincelle>Offre complète</SurtitreEtincelle>
        <ThemedText type="titreCarte" style={{ color: theme.surTexte }}>
          Jusqu’à 30 essayages par mois
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.surTexte, opacity: 0.7 }}>
          Voir l’offre →
        </ThemedText>
      </Pressable>

      <ThemedText
        type="small"
        themeColor="textSecondary"
        style={styles.lienDiscret}
        accessibilityRole="button"
        onPress={() => router.push('/supprimer-donnees')}>
        Supprimer toutes mes données
      </ThemedText>
    </Ecran>
  );
}

function Lien({ label, a11y, url }: { label: string; a11y: string; url: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={a11y}
      onPress={() => void Linking.openURL(url)}
      style={({ pressed }) => [styles.lien, { backgroundColor: theme.background }, pressed && { opacity: 0.6 }]}>
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titres: { gap: 14, marginTop: Spacing.two },
  morpho: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: Rayon.pilule, borderWidth: 1 },
  carteSoi: { padding: 12, gap: 12 },
  cadrePhoto: { borderRadius: Rayon.moyen + 2, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 3 / 4 },
  etiquette: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 12, paddingVertical: 5, borderRadius: Rayon.pilule },
  rangee: { flexDirection: 'row', gap: 10 },
  moitie: { flex: 1 },
  carteVide: { paddingVertical: 28 },
  idees: { gap: 8 },
  rangeeArticles: { gap: 12, paddingRight: 20 },
  idee: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingLeft: 18, paddingRight: 10, borderRadius: Rayon.moyen, borderWidth: 1 },
  ideeNom: { flex: 1 },
  lien: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Rayon.pilule },
  offre: { borderRadius: Rayon.grand, padding: 22, gap: 6 },
  lienDiscret: { textAlign: 'center', textDecorationLine: 'underline', paddingVertical: Spacing.two },
});
