import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { ChoixVetement } from '@/components/essayage/choix-vetement';
import { ResultatEssayage } from '@/components/essayage/resultat-essayage';
import { VetementPret } from '@/components/essayage/vetement-pret';
import { Chargement, Ecran, MessageErreur } from '@/components/ui';
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
import { noter } from '@/lib/mesure';
import { activerNotifications } from '@/lib/notifications';

// Choisir le vêtement à essayer : photo, lien d'article ou pièce du dressing.
// Un partage depuis une autre app (écran partage) ou l'historique arrive ici avec `?essai=<id>` déjà créé.
// Un essai déjà fait s'ouvre directement sur son résultat.
export default function Vetement() {
  const { essai: essaiPartage } = useLocalSearchParams<{ essai?: string }>();
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
      noter('vetement_choisi');
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
      noter('essai_lance');
      // Premier essayage : on propose d'être prévenu quand l'image est prête (sans bloquer le lancement).
      void activerNotifications();
      setResultat(await essayer(id, setEtape));
      noter('essai_reussi');
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
    return (
      <Ecran fermable eyebrow="Résultat" titre="Sur toi">
        <ResultatEssayage
          url={resultat}
          aime={essai ? essai.avis === 'aime' : null}
          onAime={() => void choisirAvis('aime')}
          onAgrandir={() =>
            router.push({ pathname: '/image', params: { url: resultat, nom: `essayage-${essai?.id ?? 'image'}.png` } })
          }
          onStory={() => router.push({ pathname: '/partager', params: { url: resultat } })}
          enregistrement={enregistrement}
          onEnregistrer={() => void telechargerResultat()}
          conseil={conseil}
          achat={achat}
          onAcheter={() => achat && void ouvrirAchat(achat.url)}
          onAutre={() => {
            setResultat(null);
            setEssai(null);
            setEnregistrement(null);
          }}
        />
        <MessageErreur>{erreur}</MessageErreur>
      </Ecran>
    );
  }

  if (essai) {
    return (
      <Ecran fermable eyebrow="Vêtement prêt" titre="On l’essaie ?">
        <VetementPret
          url={essai.url}
          dejaLance={essai.statut === 'en_cours'}
          etape={etape}
          messages={messagesAttente(conseil?.objectif ?? null, conseil?.aPrivilegier ?? [])}
          occupe={occupe}
          onEssayer={() => void lancerEssayage(essai.id)}
          onAutre={() => setEssai(null)}
        />
        <MessageErreur>{erreur}</MessageErreur>
      </Ecran>
    );
  }

  return (
    <Ecran fermable eyebrow="Nouvel essayage" titre="Quel vêtement essayer ?">
      <ChoixVetement
        pieces={pieces}
        occupe={occupe}
        onPhoto={(source) => void depuisPhoto(source)}
        onLien={(lien) => void lancer(() => essaiDepuisLien(lien))}
        onPiece={(piece) => void lancer(() => essaiDepuisPiece(piece))}
      />
      {occupe && <Chargement texte="Préparation du vêtement…" />}
      <MessageErreur>{erreur}</MessageErreur>
    </Ecran>
  );
}
