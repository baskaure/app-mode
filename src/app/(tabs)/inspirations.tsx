import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { IdeesRecherche } from "@/components/accueil/idees-recherche";
import { CarteArticle } from "@/components/catalogue/carte-article";
import { ThemedText } from "@/components/themed-text";
import {
  Chargement,
  Ecran,
  EtatVide,
  Grille,
  Mention,
  MessageErreur,
  Pastille,
  Section,
} from "@/components/ui";
import { Espace, Gouttiere } from "@/constants/theme";
import { useInspirations } from "@/hooks/use-inspirations";
import type { Categorie } from "@/lib/catalogue-regles";
import { conseilPour } from "@/lib/morphologie";
import { ideesDressing, suggestions, touche } from "@/lib/suggestions";
import { useProfil } from "@/state/profil";

const FILTRES: {
  label: string;
  valeur: Categorie | "tout";
  femme?: boolean;
}[] = [
  { label: "Tout", valeur: "tout" },
  { label: "Hauts", valeur: "haut" },
  { label: "Bas", valeur: "bas" },
  { label: "Robes", valeur: "robe", femme: true },
  { label: "Vestes", valeur: "veste" },
  { label: "Chaussures", valeur: "chaussures" },
];

// Onglet « Inspirations » : de vrais articles, d'abord ce qui va avec le dressing, puis le style du questionnaire.
export default function Inspirations() {
  const { profil } = useProfil();
  const {
    chargement,
    erreur,
    articles,
    pourStyle,
    avecDressing,
    pieces,
    enAnalyse,
  } = useInspirations();
  const [filtre, setFiltre] = useState<Categorie | "tout">("tout");
  const garder = <T extends { article: { categorie: Categorie } }>(l: T[]) =>
    filtre === "tout" ? l : l.filter((r) => r.article.categorie === filtre);
  const piecesParId = new Map(pieces.map((p) => [p.id, p]));
  const dressing = garder(avecDressing).slice(0, 12);
  const style = garder(pourStyle);
  const affilies = articles.some((a) => a.source === "awin");
  // Sans catalogue (en attendant les marques partenaires) : des idées de recherche tirées du dressing et de la silhouette.
  const vestiaire = profil.vestiaire ?? "femme";
  const conseil = profil.silhouette
    ? conseilPour(profil.silhouette, vestiaire)
    : null;
  const ideesSilhouette =
    conseil && profil.style
      ? suggestions(conseil.aPrivilegier, profil.style, vestiaire)
      : [];
  const ideesPieces = profil.style
    ? ideesDressing(pieces, profil.style, vestiaire)
    : [];
  const sansCatalogue = !chargement && articles.length === 0;

  return (
    <Ecran
      onglet
      eyebrow="Inspirations"
      titre="Pour toi"
      intro={
        profil.style
          ? `${sansCatalogue ? 'Des idées' : 'Des articles choisis'} pour ton style : ${touche(profil.style)}.`
          : undefined
      }
    >
      {!sansCatalogue && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtres}
        >
          {FILTRES.filter((f) => !f.femme || profil.vestiaire !== "homme").map(
            (f) => (
              <Pastille
                key={f.valeur}
                label={f.label}
                selectionne={filtre === f.valeur}
                onPress={() => setFiltre(f.valeur)}
              />
            ),
          )}
        </ScrollView>
      )}

      <MessageErreur>{erreur}</MessageErreur>

      {chargement ? (
        <Chargement texte="Chargement du catalogue…" />
      ) : sansCatalogue ? (
        <>
          {ideesPieces.length > 0 ? (
            <IdeesRecherche
              titre="Avec ton dressing"
              detail="Une pièce qui se porte avec ce que tu as déjà. Trouve-la, puis partage-la vers l’app pour l’essayer."
              idees={ideesPieces}
              touche=""
            />
          ) : (
            <EtatVide
              titre="Ton dressing est vide"
              texte="Ajoute quelques pièces : Akalie te dit ce qui va avec."
              action={{
                label: "Ouvrir mon dressing",
                onPress: () => router.push("/dressing"),
              }}
            />
          )}
          {ideesSilhouette.length > 0 && profil.style && (
            <IdeesRecherche
              titre="Pour ta silhouette"
              idees={ideesSilhouette}
              touche={touche(profil.style)}
            />
          )}
        </>
      ) : (
        <>
          <Section
            titre="Avec ton dressing"
            detail="Des pièces qui se portent avec ce que tu as déjà."
          >
            {pieces.length === 0 ? (
              <EtatVide
                titre="Ton dressing est vide"
                texte="Ajoute quelques pièces : Akalie te propose ce qui va avec."
                action={{
                  label: "Ouvrir mon dressing",
                  onPress: () => router.push("/dressing"),
                }}
              />
            ) : dressing.length === 0 ? (
              enAnalyse > 0 ? (
                <Chargement
                  texte={`J’analyse ton dressing (${enAnalyse} pièce${enAnalyse > 1 ? "s" : ""})…`}
                />
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  Rien dans cette catégorie pour l’instant.
                </ThemedText>
              )
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rangee}
              >
                {dressing.map((r) => (
                  <CarteArticle
                    key={r.article.id}
                    reco={r}
                    piece={r.pieceId ? piecesParId.get(r.pieceId) : null}
                    largeur={168}
                  />
                ))}
              </ScrollView>
            )}
          </Section>

          <Section titre="Dans ton style">
            {style.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Rien dans cette catégorie pour l’instant.
              </ThemedText>
            ) : (
              <Grille>
                {style.map((r) => (
                  <CarteArticle key={r.article.id} reco={r} raison={false} />
                ))}
              </Grille>
            )}
          </Section>

          {affilies && (
            <Mention>
              Liens affiliés : si tu achètes, nous touchons une petite
              commission, sans surcoût pour toi.
            </Mention>
          )}
        </>
      )}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  filtres: { gap: Espace.s, paddingRight: Gouttiere },
  rangee: { gap: Espace.m, paddingRight: Gouttiere },
});
