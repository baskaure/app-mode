import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { Carte, Chargement, Ecran, MessageErreur } from '@/components/ui';
import { Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  ajouterPiece,
  analyserPiece,
  analyserPiecesEnAttente,
  choisirPhoto,
  listerPieces,
  supprimerPiece,
  type Piece,
  type Source,
} from '@/lib/dressing';

const MINIMUM = 3;

export default function Dressing() {
  const theme = useTheme();
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    try {
      setPieces(await listerPieces());
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    let annule = false;
    void (async () => {
      try {
        const liste = await listerPieces();
        if (annule) return;
        setPieces(liste);
        setChargement(false);
        // Pièces jamais analysées (ajoutées avant le catalogue, ou analyse en échec) : on les reprend ici.
        if ((await analyserPiecesEnAttente(liste)) > 0 && !annule) setPieces(await listerPieces());
      } catch (e) {
        if (!annule) setErreur(e instanceof Error ? e.message : String(e));
      } finally {
        if (!annule) setChargement(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, []);

  const ajouter = async (source: Source) => {
    setErreur(null);
    try {
      const photo = await choisirPhoto(source);
      if (!photo) return;
      setEnvoi(true);
      const id = await ajouterPiece(photo);
      await recharger();
      // L'IA reconnaît la pièce (catégorie, couleur) pour les inspirations ; la carte se met à jour ensuite.
      void analyserPiece(id).then((ok) => {
        if (ok) void recharger();
      });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (piece: Piece) => {
    try {
      await supprimerPiece(piece);
      setPieces((liste) => liste.filter((p) => p.id !== piece.id));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  };

  const restantes = Math.max(0, MINIMUM - pieces.length);

  return (
    <Ecran
      onglet
      eyebrow={pieces.length > 0 ? `${pieces.length} pièce${pieces.length > 1 ? 's' : ''}` : 'Dressing'}
      titre="Ton dressing"
      intro="Pose un vêtement à plat, à la lumière du jour, et prends-le en photo. Une IA (Anthropic, États-Unis) reconnaît son type et sa couleur pour te proposer ce qui va avec.">
      {restantes > 0 && (
        <Carte accent style={styles.objectif}>
          <View style={styles.points}>
            {Array.from({ length: MINIMUM }, (_, i) => (
              <View
                key={i}
                style={[styles.point, { backgroundColor: i < pieces.length ? theme.text : theme.backgroundElement }]}
              />
            ))}
          </View>
          <ThemedText type="smallBold">
            Encore {restantes} pièce{restantes > 1 ? 's' : ''} pour tes premières tenues.
          </ThemedText>
        </Carte>
      )}

      <View style={styles.boutons}>
        <Bouton label="Prendre une photo" chargement={envoi} onPress={() => void ajouter('camera')} />
        <Bouton variante="secondaire" label="Choisir dans la galerie" desactive={envoi} onPress={() => void ajouter('galerie')} />
      </View>

      {envoi && <Chargement texte="Envoi de la photo…" />}
      <MessageErreur>{erreur}</MessageErreur>

      {chargement ? (
        <Chargement />
      ) : (
        <View style={styles.grille}>
          {pieces.map((piece) => (
            <View key={piece.id} style={[styles.carte, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              {piece.url ? (
                <Image source={{ uri: piece.url }} style={styles.photo} contentFit="cover" />
              ) : (
                <View style={[styles.photo, { backgroundColor: theme.backgroundSelected }]} />
              )}
              <View style={styles.legende}>
                <ThemedText type="small" numberOfLines={1} themeColor={piece.description ? 'text' : 'textSecondary'}>
                  {piece.description
                    ? piece.description.replace(/^(ton|ta|tes) /, '').replace(/^./, (c) => c.toUpperCase())
                    : piece.analyse_at
                      ? 'Pièce non reconnue'
                      : 'Analyse en cours…'}
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Supprimer cette pièce"
                onPress={() => void supprimer(piece)}
                style={({ pressed }) => [styles.supprimer, pressed && { opacity: 0.5 }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  Retirer
                </ThemedText>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  objectif: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  points: { flexDirection: 'row', gap: 6 },
  point: { width: 10, height: 10, borderRadius: 5 },
  boutons: { gap: 10 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  carte: { width: '48%', flexGrow: 1, maxWidth: '48.5%', borderRadius: Rayon.moyen, borderWidth: 1, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 3 / 4 },
  legende: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 2 },
  supprimer: { paddingVertical: 10, alignItems: 'center' },
});
