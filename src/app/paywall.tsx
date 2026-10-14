import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { Chargement, Ecran, MessageInfo, Puce, SurtitreEtincelle } from '@/components/ui';
import { Aura, Police, Rayon } from '@/constants/theme';
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
            backgroundColor: theme.backgroundElement,
            borderColor: selectionne ? theme.text : theme.border,
          },
        ]}>
        <View style={[styles.radio, { borderColor: selectionne ? theme.text : theme.border }]}>
          {selectionne && <View style={[styles.radioPlein, { backgroundColor: theme.text }]} />}
        </View>
        <View style={styles.formuleTexte}>
          <View style={styles.entete}>
            <ThemedText type="titreCarte">{titre}</ThemedText>
            {id === 'annuel' && (
              <View style={[styles.badge, { backgroundColor: theme.accentTexte }]}>
                <ThemedText style={[styles.badgeTexte, { color: theme.surTexte }]}>Le plus choisi</ThemedText>
              </View>
            )}
          </View>
          <ThemedText>{duStore ? `${prix}${id === 'annuel' ? ' par an' : ' par mois'}` : prix}</ThemedText>
          {parMois && (
            <ThemedText type="small" themeColor="textSecondary">
              soit {parMois}
              {duStore ? ' par mois' : ''}
            </ThemedText>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Ecran fermable>
      <View style={styles.tete}>
        <View style={styles.pastilles}>
          {[Aura.rose, Aura.peche, Aura.lilas].map((c) => (
            <View key={c} style={[styles.pastille, { backgroundColor: c, borderColor: theme.background }]} />
          ))}
        </View>
        <SurtitreEtincelle>Offre complète</SurtitreEtincelle>
        <ThemedText type="title">Essaie-le sur toi avant de l’acheter</ThemedText>
      </View>

      <View style={styles.liste}>
        <Puce>Jusqu’à 30 essayages par mois sur ta propre photo</Puce>
        <Puce>Pourquoi chaque vêtement va, ou pas, à ta morphologie</Puce>
        <Puce>Ton dressing pour associer tes nouvelles pièces</Puce>
      </View>

      <View style={styles.formules}>
        {ligne('annuel', 'Annuel')}
        {ligne('mensuel', 'Mensuel')}
      </View>

      {message && <MessageInfo>{message}</MessageInfo>}

      <View style={styles.actions}>
        {chargement ? (
          <Chargement />
        ) : (
          <Bouton
            label={vendable ? 'S’abonner' : 'Bientôt disponible sur l’app mobile'}
            desactive={!vendable}
            chargement={occupe}
            onPress={() => void sAbonner()}
          />
        )}
        {achatsDisponibles() && (
          <Bouton variante="secondaire" label="Restaurer mes achats" desactive={occupe} onPress={() => void restaurerAchats()} />
        )}
        <Bouton variante="discret" label="Plus tard" desactive={occupe} onPress={() => fermer()} />
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.legal}>
        Abonnement renouvelé automatiquement au même prix, sauf résiliation au moins 24 h avant la fin de la
        période. Résiliable à tout moment dans les réglages de ton compte App Store ou Google Play. Le paiement est
        débité sur ce compte à la confirmation de l’achat.
      </ThemedText>
      <View style={styles.liens}>
        {LIEN_CGU && (
          <ThemedText type="link" onPress={() => void WebBrowser.openBrowserAsync(LIEN_CGU!)}>
            Conditions d’utilisation
          </ThemedText>
        )}
        {LIEN_CONFIDENTIALITE && (
          <ThemedText type="link" onPress={() => void WebBrowser.openBrowserAsync(LIEN_CONFIDENTIALITE!)}>
            Politique de confidentialité
          </ThemedText>
        )}
      </View>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  tete: { gap: 12 },
  pastilles: { flexDirection: 'row', marginBottom: 4 },
  pastille: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, marginRight: -10 },
  liste: { gap: 10 },
  formules: { gap: 10 },
  formule: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', borderRadius: Rayon.grand, borderWidth: 2, padding: 18 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  radioPlein: { width: 10, height: 10, borderRadius: 5 },
  formuleTexte: { flex: 1, gap: 2 },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Rayon.pilule },
  badgeTexte: { fontFamily: Police.demiGras, fontSize: 11, lineHeight: 15 },
  actions: { gap: 10 },
  legal: { fontSize: 12, lineHeight: 17 },
  liens: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
});
