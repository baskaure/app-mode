import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Bouton } from '@/components/choix';
import { ThemedText } from '@/components/themed-text';
import { CaseACocher, Carte, Ecran, MessageErreur, Puce } from '@/components/ui';
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
    <Ecran fermable eyebrow="Tes données" titre="Supprimer toutes mes données" intro="Tout sera effacé de nos serveurs, définitivement :">
      <Carte>
        <View style={styles.liste}>
          {CE_QUI_EST_EFFACE.map((ligne) => (
            <Puce key={ligne}>{ligne}</Puce>
          ))}
        </View>
      </Carte>
      <ThemedText type="small" themeColor="textSecondary">
        Les images déjà envoyées à nos prestataires d’IA sont effacées chez eux selon leurs propres délais (voir la
        politique de confidentialité). Un abonnement en cours n’est pas résilié par cette suppression : résilie-le dans
        les réglages de ton store.
      </ThemedText>

      <CaseACocher coche={compris} onPress={() => setCompris((c) => !c)}>
        <ThemedText>J’ai compris que c’est définitif et que je ne pourrai rien récupérer.</ThemedText>
      </CaseACocher>

      <MessageErreur>{erreur}</MessageErreur>

      <View style={styles.actions}>
        {abonne ? (
          <>
            {achatsDisponibles() && (
              <Bouton variante="secondaire" label="Gérer mon abonnement" desactive={occupe} onPress={() => void gererAbonnement()} />
            )}
            <Bouton
              variante="danger"
              label="Supprimer quand même"
              desactive={!compris}
              chargement={occupe}
              onPress={() => void supprimer(true)}
            />
          </>
        ) : (
          <Bouton
            variante="danger"
            label="Supprimer définitivement"
            desactive={!compris}
            chargement={occupe}
            onPress={() => void supprimer(false)}
          />
        )}
        <Bouton variante="discret" label="Annuler" desactive={occupe} onPress={() => fermer()} />
      </View>

      {identifiant && (
        <ThemedText type="small" themeColor="textSecondary" selectable style={styles.identifiant}>
          Ton identifiant (à donner si tu nous écris) : {identifiant}
        </ThemedText>
      )}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  liste: { gap: 10 },
  actions: { gap: 10 },
  identifiant: { textAlign: 'center', fontSize: 12 },
});
