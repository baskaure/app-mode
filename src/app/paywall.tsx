import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EnteteOffre } from '@/components/paywall/entete-offre';
import { LigneFormule } from '@/components/paywall/ligne-formule';
import { Bouton, Chargement, Ecran, LienDiscret, MessageInfo } from '@/components/ui';
import { Espace } from '@/constants/theme';
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
import { noter } from '@/lib/mesure';
import { economieAnnuel } from '@/lib/prix';

// Paywall (étape 6 du BRIEF), affiché après l'essayage offert. Prix validés le 12 oct. 2026 : 59,99 €/an ou
// 9,99 €/mois. Les prix affichés viennent du store quand il répond ; le serveur vérifie l'abonnement lui-même.
const PRIX_AFFICHES = {
  annuel: { prix: '59,99 € par an', montant: 59.99, parMois: '5,00 € par mois' },
  mensuel: { prix: '9,99 € par mois', montant: 9.99, parMois: null },
} as const;

export default function Paywall() {
  const [formules, setFormules] = useState<Formule[]>([]);
  const [choix, setChoix] = useState<Formule['id']>('annuel');
  const [chargement, setChargement] = useState(achatsDisponibles());
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Compté même sans achats disponibles (web, Expo Go) : c'est l'arrivée sur l'offre qu'on mesure.
  useEffect(() => noter('paywall_vu'), []);

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
      if (resultat === 'actif') {
        noter('abonnement');
        fermer();
      }
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

  // Prix du store quand il répond, sinon les prix validés (affichage seulement : l'achat passe par le store).
  const affichage = (id: Formule['id']) => {
    const duStore = formules.find((f) => f.id === id);
    if (!duStore) return { prix: PRIX_AFFICHES[id].prix, detail: PRIX_AFFICHES[id].parMois && `soit ${PRIX_AFFICHES[id].parMois}` };
    return {
      prix: `${duStore.prix}${id === 'annuel' ? ' par an' : ' par mois'}`,
      detail: duStore.parMois ? `soit ${duStore.parMois} par mois` : null,
    };
  };

  const montant = (id: Formule['id']) => formules.find((f) => f.id === id)?.montant ?? PRIX_AFFICHES[id].montant;
  const economie = economieAnnuel(montant('annuel'), montant('mensuel'));

  return (
    <Ecran fermable>
      <EnteteOffre />

      <View style={styles.formules}>
        <LigneFormule titre="Annuel" {...affichage('annuel')} badge={economie ? `-${economie} %` : undefined} selectionnee={choix === 'annuel'} onPress={() => setChoix('annuel')} />
        <LigneFormule titre="Mensuel" {...affichage('mensuel')} selectionnee={choix === 'mensuel'} onPress={() => setChoix('mensuel')} />
      </View>

      <MessageInfo>{message}</MessageInfo>

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
        {achatsDisponibles() && !occupe && <LienDiscret label="Restaurer mes achats" onPress={() => void restaurerAchats()} />}
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
  formules: { gap: Espace.m },
  actions: { gap: Espace.s },
  legal: { fontSize: 12, lineHeight: 17 },
  liens: { flexDirection: 'row', flexWrap: 'wrap', gap: Espace.l },
});
