import { useCallback, useEffect, useState } from 'react';

import { CartePiece } from '@/components/dressing/carte-piece';
import { ObjectifPieces } from '@/components/dressing/objectif-pieces';
import { ThemedText } from '@/components/themed-text';
import { CaseACocher, Chargement, Ecran, Grille, ICONES, MessageErreur, RangeeTuiles, TuileAction } from '@/components/ui';
import { accordDressingDonne, donnerAccordDressing } from '@/lib/accord-dressing';
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
import { noter } from '@/lib/mesure';

const MINIMUM = 3;

export default function Dressing() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  // null tant que l'accord n'est pas lu : la case ne clignote pas au chargement.
  const [accord, setAccord] = useState<boolean | null>(null);

  useEffect(() => {
    void accordDressingDonne().then(setAccord);
  }, []);

  const accepter = () => {
    setAccord(true);
    void donnerAccordDressing().catch(() => {});
  };

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
      noter('piece_ajoutee');
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

  return (
    <Ecran
      onglet
      eyebrow={pieces.length > 0 ? `${pieces.length} pièce${pieces.length > 1 ? 's' : ''}` : 'Dressing'}
      titre="Ton dressing">
      <ObjectifPieces nombre={pieces.length} objectif={MINIMUM} />

      {accord === false && (
        <CaseACocher coche={false} onPress={accepter}>
          <ThemedText type="small">
            J’accepte que les photos de mes vêtements soient analysées par une IA (Anthropic, États-Unis, donc hors de
            l’Union européenne) pour reconnaître chaque pièce. Je peux les supprimer quand je veux.
          </ThemedText>
        </CaseACocher>
      )}

      <RangeeTuiles>
        <TuileAction nom={ICONES.photo} label="Photo" desactive={envoi || !accord} onPress={() => void ajouter('camera')} />
        <TuileAction nom={ICONES.galerie} label="Galerie" desactive={envoi || !accord} onPress={() => void ajouter('galerie')} />
      </RangeeTuiles>

      {envoi && <Chargement texte="Envoi de la photo…" />}
      <MessageErreur>{erreur}</MessageErreur>

      {chargement ? (
        <Chargement />
      ) : (
        <Grille>
          {pieces.map((piece) => (
            <CartePiece key={piece.id} piece={piece} onRetirer={() => void supprimer(piece)} />
          ))}
        </Grille>
      )}
    </Ecran>
  );
}
