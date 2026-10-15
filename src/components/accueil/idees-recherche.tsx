import { Linking, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Section } from "@/components/ui";
import { Espace, Rayon } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Suggestion } from "@/lib/suggestions";

// Sans catalogue visible : des pièces conseillées, chacune avec une recherche Vinted ou Google Shopping.
// Utilisé sur l'accueil et dans Inspirations (sans catalogue) ; `avec` affiche la pièce du dressing d'origine.
export function IdeesRecherche({
  idees,
  touche,
  titre = "Idées pour toi",
  detail,
}: {
  idees: (Suggestion & { avec?: string })[];
  touche: string;
  titre?: string;
  detail?: string;
}) {
  const theme = useTheme();
  return (
    <Section
      titre={titre}
      detail={
        detail ??
        `Pour ta silhouette et ton style (${touche}). Trouve un article, puis partage-le vers l’app, ou fais une capture et choisis-la pour l’essayer.`
      }
    >
      <View style={styles.liste}>
        {idees.map((idee) => (
          <View
            key={idee.requete}
            style={[
              styles.idee,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.nom}>
              {idee.avec && (
                <ThemedText type="small" themeColor="textSecondary">
                  {idee.avec}
                </ThemedText>
              )}
              <ThemedText>{idee.piece}</ThemedText>
            </View>
            <Lien
              label="Vinted"
              a11y={`Chercher ${idee.piece} sur Vinted`}
              url={idee.vinted}
            />
            <Lien
              label="Google"
              a11y={`Chercher ${idee.piece} sur Google Shopping`}
              url={idee.google}
            />
          </View>
        ))}
      </View>
    </Section>
  );
}

function Lien({
  label,
  a11y,
  url,
}: {
  label: string;
  a11y: string;
  url: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={a11y}
      hitSlop={Espace.xs}
      onPress={() => void Linking.openURL(url)}
      style={({ pressed }) => [
        styles.lien,
        { backgroundColor: theme.background },
        pressed && { opacity: 0.6 },
      ]}
    >
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  liste: { gap: Espace.s },
  idee: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espace.s,
    paddingVertical: Espace.m,
    paddingLeft: Espace.l,
    paddingRight: Espace.m,
    borderRadius: Rayon.moyen,
    borderWidth: 1,
  },
  nom: { flex: 1 },
  lien: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: Espace.m,
    borderRadius: Rayon.pilule,
  },
});
