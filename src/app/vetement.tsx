import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { AttenteEssayage } from '@/components/attente-essayage';
import {
  ActionIcone,
  BadgeIA,
  BarreActions,
  Carte,
  Chargement,
  Ecran,
  ICONES,
  LienDiscret,
  MessageErreur,
  RangeeTuiles,
  Section,
  TuileAction,
} from '@/components/ui';
import { Police, Rayon } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listerPieces, type Piece } from '@/lib/dressing';
import {
  AbonnementRequis,
  donnerAvis,
  essaiDepuisLien,
  essaiDepuisPhoto,
  essaiDepuisPiece,
  essayer,
  lireEssai,
  type Essai,
} from '@/lib/essais';
import { ID_EDITEUR_AWIN, chargerMarchands, ouvrirAchat } from '@/lib/achat';
import { lienAchat, type LienAchat } from '@/lib/affiliation';
import { messagesAttente } from '@/lib/attente';
import { basculerAvis, type Avis } from '@/lib/avis';
import { conseilPour } from '@/lib/morphologie';
import { useProfil } from '@/state/profil';
import { choisirPhoto, type Source } from '@/lib/photos';
import { enregistrerImage } from '@/lib/telecharger';

// Choisir le vêtement à essayer : photo, lien d'article ou pièce du dressing.
// Un partage depuis une autre app (écran partage) ou l'historique arrive ici avec `?essai=<id>` déjà créé.
// Un essai déjà fait s'ouvre directement sur son résultat.
export default function Vetement() {
  const theme = useTheme();
  const { essai: essaiPartage } = useLocalSearchParams<{ essai?: string }>();
  const [lien, setLien] = useState('');
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [essai, setEssai] = useState<Essai | null>(null);
  const [etape, setEtape] = useState<string | null>(null);
  const [resultat, setResultat] = useState<string | null>(null);
  const [avisEnCours, setAvisEnCours] = useState(false);
  const [enregistrement, setEnregistrement] = useState<'en_cours' | 'fait' | null>(null);
  // Le lien calculé est rangé avec l'article dont il vient : un autre essai n'affiche jamais un ancien bouton.
  const [achatCalcule, setAchatCalcule] = useState<{ pour: string; lien: LienAchat | null } | null>(null);
  const lienArticle = essai?.lien_url ?? null;
  const achat = achatCalcule && achatCalcule.pour === lienArticle ? achatCalcule.lien : null;

  // Lien d'achat (affilié si le marchand est dans marchands_affilies) quand le vêtement vient d'un lien d'article.
  useEffect(() => {
    if (!lienArticle) return;
    let annule = false;
    void chargerMarchands().then((marchands) => {
      if (!annule) setAchatCalcule({ pour: lienArticle, lien: lienAchat(lienArticle, marchands, ID_EDITEUR_AWIN) });
    });
    return () => {
      annule = true;
    };
  }, [lienArticle]);
  const { profil } = useProfil();
  const conseil = profil.silhouette ? conseilPour(profil.silhouette, profil.vestiaire ?? 'femme') : null;

  useEffect(() => {
    if (!essaiPartage) return;
    let annule = false;
    lireEssai(essaiPartage)
      .then((e) => {
        if (annule) return;
        setEssai(e);
        if (e.statut === 'fait' && e.urlResultat) setResultat(e.urlResultat);
      })
      .catch((e: unknown) => !annule && setErreur(e instanceof Error ? e.message : String(e)));
    return () => {
      annule = true;
    };
  }, [essaiPartage]);

  useEffect(() => {
    let annule = false;
    listerPieces()
      .then((liste) => !annule && setPieces(liste))
      .catch(() => {
        // le dressing est optionnel : sans pièces, la section ne s'affiche pas
      });
    return () => {
      annule = true;
    };
  }, []);

  const lancer = async (creer: () => Promise<string>) => {
    setOccupe(true);
    setErreur(null);
    try {
      setEssai(await lireEssai(await creer()));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe(false);
    }
  };

  const depuisPhoto = async (source: Source) => {
    setErreur(null);
    try {
      const photo = await choisirPhoto(source);
      if (photo) await lancer(() => essaiDepuisPhoto(photo));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  };

  const lancerEssayage = async (id: string) => {
    setErreur(null);
    setOccupe(true);
    try {
      setResultat(await essayer(id, setEtape));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
      // Essayage offert déjà utilisé : on montre l'offre ; au retour, le même bouton relance l'essai.
      if (e instanceof AbonnementRequis) router.push('/paywall');
    } finally {
      setEtape(null);
      setOccupe(false);
    }
  };

  // Un avis à la fois : les boutons sont bloqués le temps de l'enregistrement (pas de requêtes dans le désordre).
  const choisirAvis = async (touche: Avis) => {
    if (!essai || avisEnCours) return;
    const avant = essai.avis;
    const apres = basculerAvis(avant, touche);
    setEssai({ ...essai, avis: apres });
    setAvisEnCours(true);
    try {
      await donnerAvis(essai.id, apres);
      setErreur(null);
    } catch (e) {
      setEssai({ ...essai, avis: avant });
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setAvisEnCours(false);
    }
  };

  const telechargerResultat = async () => {
    if (!resultat) return;
    setEnregistrement('en_cours');
    try {
      await enregistrerImage(resultat, `essayage-${essai?.id ?? Date.now()}.png`);
      setEnregistrement('fait');
      setErreur(null);
    } catch (e) {
      setEnregistrement(null);
      setErreur(e instanceof Error ? e.message : String(e));
    }
  };

  if (resultat) {
    const autreVetement = () => {
      setResultat(null);
      setEssai(null);
      setEnregistrement(null);
    };
    return (
      <Ecran fermable eyebrow="Résultat" titre="Sur toi">
        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel="Agrandir l’image"
          onPress={() =>
            router.push({ pathname: '/image', params: { url: resultat, nom: `essayage-${essai?.id ?? 'image'}.png` } })
          }
          style={({ pressed }) => [styles.cadre, { backgroundColor: theme.backgroundElement }, pressed && { opacity: 0.9 }]}>
          <Image source={{ uri: resultat }} style={styles.apercu} contentFit="contain" />
          <BadgeIA />
        </Pressable>

        <BarreActions>
          {essai && (
            <ActionIcone
              nom={essai.avis === 'aime' ? ICONES.aimeActif : ICONES.aime}
              label="J’aime"
              actif={essai.avis === 'aime'}
              onPress={() => void choisirAvis('aime')}
            />
          )}
          {Platform.OS !== 'web' && (
            <ActionIcone
              nom={ICONES.partager}
              label="Story"
              onPress={() => router.push({ pathname: '/partager', params: { url: resultat } })}
            />
          )}
          <ActionIcone
            nom={ICONES.telecharger}
            label={enregistrement === 'fait' ? 'Enregistrée' : 'Enregistrer'}
            actif={enregistrement === 'fait'}
            chargement={enregistrement === 'en_cours'}
            onPress={() => void telechargerResultat()}
          />
        </BarreActions>

        {conseil && (
          <Carte accent style={styles.conseil}>
            <ThemedText type="eyebrow">{conseil.nom}</ThemedText>
            <ThemedText>{conseil.objectif}</ThemedText>
          </Carte>
        )}

        <MessageErreur>{erreur}</MessageErreur>
        {achat ? (
          <View style={styles.groupe}>
            <Bouton label="Voir l’article" onPress={() => void ouvrirAchat(achat.url)} />
            {achat.affilie && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.centre}>
                Lien affilié : si tu achètes, nous touchons une petite commission, sans surcoût pour toi.
              </ThemedText>
            )}
            <LienDiscret label="Essayer un autre vêtement" onPress={autreVetement} />
          </View>
        ) : (
          <Bouton label="Essayer un autre vêtement" onPress={autreVetement} />
        )}
      </Ecran>
    );
  }

  if (essai) {
    return (
      <Ecran fermable eyebrow="Vêtement prêt" titre="On l’essaie ?">
        {essai.url && (
          <View style={[styles.cadre, { backgroundColor: theme.backgroundElement }]}>
            <Image source={{ uri: essai.url }} style={styles.apercu} contentFit="contain" />
          </View>
        )}
        {etape && (
          <AttenteEssayage
            etape={etape}
            messages={messagesAttente(conseil?.objectif ?? null, conseil?.aPrivilegier ?? [])}
          />
        )}
        <MessageErreur>{erreur}</MessageErreur>
        <Bouton
          label={essai.statut === 'en_cours' ? 'Voir le résultat' : 'M’essayer ce vêtement'}
          chargement={occupe}
          onPress={() => void lancerEssayage(essai.id)}
        />
        {!occupe && <LienDiscret label="Choisir un autre vêtement" onPress={() => setEssai(null)} />}
      </Ecran>
    );
  }

  const lienValide = /^https?:\/\/\S+\.\S+/.test(lien.trim());
  return (
    <Ecran fermable eyebrow="Nouvel essayage" titre="Quel vêtement essayer ?">
      <Carte>
        <Section titre="Une photo du vêtement" detail="Une capture d’écran de l’article, ou une photo prise en magasin.">
          <RangeeTuiles>
            <TuileAction nom={ICONES.photo} label="Photo" desactive={occupe} onPress={() => void depuisPhoto('camera')} />
            <TuileAction nom={ICONES.galerie} label="Galerie" desactive={occupe} onPress={() => void depuisPhoto('galerie')} />
          </RangeeTuiles>
        </Section>
      </Carte>

      <Carte>
        <Section titre="Le lien de l’article">
          <View style={[styles.champLigne, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <TextInput
            value={lien}
            onChangeText={setLien}
            placeholder="https://www.zara.com/fr/…"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            inputMode="url"
            returnKeyType="go"
            onSubmitEditing={() => lienValide && !occupe && void lancer(() => essaiDepuisLien(lien))}
            style={[styles.champ, { color: theme.text }]}
          />
          <ActionIcone
            nom={ICONES.valider}
            label="Utiliser ce lien"
            surPhoto
            desactive={occupe || !lienValide}
            onPress={() => void lancer(() => essaiDepuisLien(lien))}
          />
          </View>
        </Section>
      </Carte>

      {pieces.length > 0 && (
        <Section titre="Une pièce de ton dressing">
          <ScrollView horizontal contentContainerStyle={styles.rangee} showsHorizontalScrollIndicator={false}>
            {pieces.map((piece) => (
              <Pressable
                key={piece.id}
                accessibilityRole="button"
                accessibilityLabel="Essayer cette pièce"
                disabled={occupe}
                onPress={() => void lancer(() => essaiDepuisPiece(piece))}
                style={({ pressed }) => [styles.vignetteCadre, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}>
                {piece.url && <Image source={{ uri: piece.url }} style={styles.vignette} contentFit="cover" />}
              </Pressable>
            ))}
          </ScrollView>
        </Section>
      )}

      {occupe && <Chargement texte="Préparation du vêtement…" />}
      <MessageErreur>{erreur}</MessageErreur>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  groupe: { gap: 10 },
  centre: { textAlign: 'center' },
  champLigne: { flexDirection: 'row', alignItems: 'center', borderRadius: Rayon.moyen, borderWidth: 1, paddingRight: 6 },
  champ: { flex: 1, paddingHorizontal: 18, paddingVertical: 16, fontSize: 16, fontFamily: Police.normal },
  rangee: { gap: 10 },
  vignetteCadre: { borderRadius: Rayon.petit + 2, borderWidth: 1, overflow: 'hidden' },
  vignette: { width: 104, height: 138 },
  cadre: { borderRadius: Rayon.grand, overflow: 'hidden' },
  apercu: { width: '100%', aspectRatio: 3 / 4 },
  conseil: { gap: 6 },
});
