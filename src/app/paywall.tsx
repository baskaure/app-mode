import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  acheter,
  achatsDisponibles,
  chargerFormules,
  LIEN_CGU,
  LIEN_CONFIDENTIALITE,
  restaurer,
  type Formule,
} from '@/lib/abonnement';
import { fermer } from '@/lib/navigation';

// Paywall (étape 6 du BRIEF), affiché après l'essayage offert. Prix validés le 12 oct. 2026 : 59,99 €/an ou
// 9,99 €/mois. Les prix affichés viennent du store quand il répond ; le serveur vérifie l'abonnement lui-même.
const PRIX_AFFICHES = {
  annuel: { prix: '59,99 € par an', parMois: '5,00 € par mois' },
  mensuel: { prix: '9,99 € par mois', parMois: null },
} as const;

export default function Paywall() {
  const theme = useTheme();
  const [formules, setFormules] = useState<Formule[]>([]);
  const [choix, setChoix] = useState<Formule['id']>('annuel');
  const [chargement, setChargement] = useState(achatsDisponibles());
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!achatsDisponibles()) return;
    let annule = false;
    chargerFormules()
      .then((liste) => !annule && setFormules(liste))
      .catch(() => !annule && setMessage('Les offres ne sont pas disponibles pour le moment. Réessaie plus tard.'))
      .finally(() => !annule && setChargement(false));
    return () => {
      annule = true;
    };
  }, []);

  const formuleChoisie = formules.find((f) => f.id === choix) ?? null;
  const vendable = achatsDisponibles() && formuleChoisie !== null;

  const sAbonner = async () => {
    if (!formuleChoisie) return;
    setOccupe(true);
    setMessage(null);
    try {
      const resultat = await acheter(formuleChoisie);
      if (resultat === 'actif') fermer();
      else if (resultat === 'en_attente') {
        setMessage('Achat enregistré, activation en cours. Si rien ne change d’ici quelques minutes, touche « Restaurer mes achats ».');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe(false);
    }
  };

  const restaurerAchats = async () => {
    setOccupe(true);
    setMessage(null);
    try {
      if (await restaurer()) fermer();
      else setMessage('Aucun abonnement trouvé sur ce compte du store.');
    } catch {
      setMessage('La restauration n’a pas abouti. Réessaie dans un instant.');
    } finally {
      setOccupe(false);
    }
  };

  const ligne = (id: Formule['id'], titre: string) => {
    const duStore = formules.find((f) => f.id === id);
    const prix = duStore?.prix ?? PRIX_AFFICHES[id].prix;
    const parMois = duStore ? duStore.parMois : PRIX_AFFICHES[id].parMois;
    const selectionne = choix === id;
    return (
      <Pressable
        key={id}
        accessibilityRole="radio"
        accessibilityState={{ selected: selectionne }}
        onPress={() => setChoix(id)}
        style={[
          styles.formule,
          {
            backgroundColor: selectionne ? theme.backgroundSelected : theme.backgroundElement,
            borderColor: selectionne ? theme.text : 'transparent',
          },
        ]}>
        <View style={styles.entete}>
          <ThemedText type="smallBold">{titre}</ThemedText>
          {id === 'annuel' && (
            <ThemedText type="small" style={styles.badge}>
              Le plus choisi
            </ThemedText>
          )}
        </View>
        <ThemedText>{duStore ? `${prix}${id === 'annuel' ? ' par an' : ' par mois'}` : prix}</ThemedText>
        {parMois && (
          <ThemedText type="small" themeColor="textSecondary">
            soit {parMois}
            {duStore ? ' par mois' : ''}
          </ThemedText>
        )}
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.fond}>
      <SafeAreaView style={styles.zone}>
        <ScrollView contentContainerStyle={styles.contenu}>
          <ThemedText type="subtitle">Essaie-le sur toi avant de l’acheter</ThemedText>
          <View style={styles.liste}>
            <ThemedText>• Jusqu’à 30 essayages par mois sur ta propre photo</ThemedText>
            <ThemedText>• Pourquoi chaque vêtement va, ou pas, à ta morphologie</ThemedText>
            <ThemedText>• Ton dressing pour associer tes nouvelles pièces</ThemedText>
          </View>

          {ligne('annuel', 'Annuel')}
          {ligne('mensuel', 'Mensuel')}

          {chargement ? (
            <ActivityIndicator />
          ) : (
            <Bouton
              label={vendable ? 'S’abonner' : 'Bientôt disponible sur l’app mobile'}
              desactive={!vendable || occupe}
              onPress={() => void sAbonner()}
            />
          )}
          {achatsDisponibles() && (
            <Bouton label="Restaurer mes achats" desactive={occupe} onPress={() => void restaurerAchats()} />
          )}
          <Bouton label="Plus tard" desactive={occupe} onPress={() => fermer()} />

          {message && (
            <ThemedText type="small" style={styles.erreur}>
              {message}
            </ThemedText>
          )}
          <ThemedText type="small" themeColor="textSecondary">
            Abonnement renouvelé automatiquement au même prix, sauf résiliation au moins 24 h avant la fin de la
            période. Résiliable à tout moment dans les réglages de ton compte App Store ou Google Play. Le paiement est
            débité sur ce compte à la confirmation de l’achat.
          </ThemedText>
          <View style={styles.liens}>
            {LIEN_CGU && (
              <ThemedText type="small" style={styles.lien} onPress={() => void WebBrowser.openBrowserAsync(LIEN_CGU!)}>
                Conditions d’utilisation
              </ThemedText>
            )}
            {LIEN_CONFIDENTIALITE && (
              <ThemedText
                type="small"
                style={styles.lien}
                onPress={() => void WebBrowser.openBrowserAsync(LIEN_CONFIDENTIALITE!)}>
                Politique de confidentialité
              </ThemedText>
            )}
          </View>
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
  formule: { borderRadius: 14, borderWidth: 2, padding: Spacing.three, gap: Spacing.one },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { fontWeight: '600' },
  erreur: { color: '#D93025' },
  liens: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  lien: { textDecorationLine: 'underline' },
});
