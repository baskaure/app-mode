import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listerArticles } from '@/lib/catalogue';
import { avecTonDressing, pourTonStyle, type Article, type Recommandation } from '@/lib/catalogue-regles';
import { analyserPiecesEnAttente, listerPieces, type Piece } from '@/lib/dressing';
import { conseilPour } from '@/lib/morphologie';
import { useProfil } from '@/state/profil';

export type Inspirations = {
  chargement: boolean;
  erreur: string | null;
  articles: Article[];
  pourStyle: Recommandation[];
  avecDressing: Recommandation[];
  pieces: Piece[];
  // Pièces du dressing pas encore analysées par l'IA (leur analyse tourne en arrière-plan).
  enAnalyse: number;
};

// Catalogue + dressing, relus à chaque retour sur l'écran. Les pièces jamais analysées le sont en arrière-plan,
// puis les recommandations « avec ton dressing » sont recalculées.
export function useInspirations(): Inspirations {
  const { profil } = useProfil();
  const [articles, setArticles] = useState<Article[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enAnalyse, setEnAnalyse] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let annule = false;
      void (async () => {
        try {
          const [liste, mesPieces] = await Promise.all([
            listerArticles(profil.vestiaire),
            listerPieces().catch(() => [] as Piece[]),
          ]);
          if (annule) return;
          setArticles(liste);
          setPieces(mesPieces);
          setErreur(null);
          setChargement(false);
          const attente = mesPieces.filter((p) => !p.analyse_at).length;
          setEnAnalyse(attente);
          if (attente && (await analyserPiecesEnAttente(mesPieces)) > 0 && !annule) {
            const relues = await listerPieces();
            if (!annule) {
              setPieces(relues);
              setEnAnalyse(relues.filter((p) => !p.analyse_at).length);
            }
          }
        } catch (e) {
          if (!annule) {
            setErreur(e instanceof Error ? e.message : String(e));
            setChargement(false);
          }
        }
      })();
      return () => {
        annule = true;
      };
    }, [profil.vestiaire]),
  );

  const conseil = profil.silhouette ? conseilPour(profil.silhouette, profil.vestiaire ?? 'femme') : null;
  return {
    chargement,
    erreur,
    articles,
    pourStyle: pourTonStyle(articles, profil.style, profil.vestiaire, conseil?.aPrivilegier ?? []),
    avecDressing: avecTonDressing(articles, pieces, profil.style, profil.vestiaire),
    pieces,
    enAnalyse,
  };
}
