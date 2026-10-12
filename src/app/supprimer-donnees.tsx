import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { achatsDisponibles, gererAbonnement } from '@/lib/abonnement';
import { AbonnementActif, monIdentifiant, supprimerToutesMesDonnees } from '@/lib/compte';
import { fermer } from '@/lib/navigation';
import { useProfil } from '@/state/profil';

const CE_QUI_EST_EFFACE = [
  'Ta photo et tes images d’essayage',
  'Les vêtements que tu as essayés et ton dressing',
  'Tes réponses au questionnaire et ta silhouette',
  'Ton historique d’essayages et ton compte',
];

// « Supprimer toutes mes données » (politique de confidentialité, section 6). Définitif : case à cocher d'abord.
export default function SupprimerDonnees() {
  const theme = useTheme();
  const { pret, repartirDeZero } = useProfil();
  const [compris, setCompris] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [abonne, setAbonne] = useState(false);
  const [identifiant, setIdentifiant] = useState<string | null>(null);

  // L'identifiant n'existe qu'une fois la session (compte anonyme) prête.
  useEffect(() => {
    if (pret) void monIdentifiant().then(setIdentifiant);
  }, [pret]);

  const supprimer = async (malgreAbonnement: boolean) => {
    setOccupe(true);
    setErreur(null);
    try {
      await supprimerToutesMesDonnees(malgreAbonnement);
      await repartirDeZero();
      router.replace('/onboarding');
    } catch (e) {
      if (e instanceof AbonnementActif) setAbonne(true);
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe(false);
    }
  };

  return (
    <ThemedView style={styles.fond}>
      <SafeAreaView style={styles.zone}>
        <ScrollView contentContainerStyle={styles.contenu}>
          <ThemedText type="subtitle">Supprimer toutes mes données</ThemedText>
          <ThemedText>Tout sera effacé de nos serveurs, définitivement :</ThemedText>
          <View style={styles.liste}>
            {CE_QUI_EST_EFFACE.map((ligne) => (
              <ThemedText key={ligne}>• {ligne}</ThemedText>
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Les images déjà envoyées à nos prestataires d’IA sont effacées chez eux selon leurs propres délais (voir la
            politique de confidentialité). Un abonnement en cours n’est pas résilié par cette suppression : résilie-le
            dans les réglages de ton store.
          </ThemedText>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: compris }}
            onPress={() => setCompris((c) => !c)}
            style={styles.case}>
            <View
              style={[styles.coche, { borderColor: theme.text, backgroundColor: compris ? theme.text : 'transparent' }]}
            />
            <ThemedText style={styles.texteCase}>J’ai compris que c’est définitif et que je ne pourrai rien récupérer.</ThemedText>
          </Pressable>

          {abonne ? (
            <>
              {achatsDisponibles() && (
                <Bouton label="Gérer mon abonnement" desactive={occupe} onPress={() => void gererAbonnement()} />
              )}
              <Bouton
                label="Supprimer quand même"
                desactive={!compris || occupe}
                onPress={() => void supprimer(true)}
              />
            </>
          ) : (
            <Bouton
              label="Supprimer définitivement"
              desactive={!compris || occupe}
              onPress={() => void supprimer(false)}
            />
          )}
          <Bouton label="Annuler" desactive={occupe} onPress={() => fermer()} />

          {occupe && <ActivityIndicator />}
          {erreur && (
            <ThemedText type="small" style={styles.erreur}>
              {erreur}
            </ThemedText>
          )}
          {identifiant && (
            <ThemedText type="small" themeColor="textSecondary" selectable>
              Ton identifiant (à donner si tu nous écris) : {identifiant}
            </ThemedText>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  zone: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  contenu: { padding: Spacing.four, gap: Spacing.three },
  liste: { gap: Spacing.one },
  case: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  coche: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, marginTop: 2 },
  texteCase: { flex: 1 },
  erreur: { color: '#D93025' },
});
