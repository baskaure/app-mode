import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApercuInspirations } from '@/components/accueil/apercu-inspirations';
import { CarteOffre } from '@/components/accueil/carte-offre';
import { CartePhotoSoi } from '@/components/accueil/carte-photo-soi';
import { IdeesRecherche } from '@/components/accueil/idees-recherche';
import { ThemedText } from '@/components/themed-text';
import { Chargement, Ecran, Etiquette, LienDiscret, Logo, MessageErreur } from '@/components/ui';
import { Espace } from '@/constants/theme';
import { useInspirations } from '@/hooks/use-inspirations';
import { conseilPour } from '@/lib/morphologie';
import { lireSilhouette, supprimerSilhouette, type Silhouette } from '@/lib/silhouette';
import { suggestions, touche } from '@/lib/suggestions';
import { useProfil } from '@/state/profil';

// Onglet principal : la photo de soi, puis le vêtement à essayer.
export default function Essayer() {
  const { profil } = useProfil();
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
        {conseil && <Etiquette texte={conseil.nom} />}
      </View>

      {chargement ? <Chargement /> : <CartePhotoSoi silhouette={silhouette} onSupprimer={() => void supprimer()} />}
      <MessageErreur>{erreur}</MessageErreur>

      {apercu.length > 0 ? (
        <ApercuInspirations recos={apercu} pieces={inspirations.pieces} />
      ) : (
        idees.length > 0 && profil.style && <IdeesRecherche idees={idees} touche={touche(profil.style)} />
      )}

      <CarteOffre />
      <LienDiscret label="Supprimer toutes mes données" onPress={() => router.push('/supprimer-donnees')} />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  titres: { gap: Espace.m, marginTop: Espace.s },
});
