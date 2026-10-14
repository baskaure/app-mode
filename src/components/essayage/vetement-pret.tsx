import { AttenteEssayage } from '@/components/essayage/attente-essayage';
import { PhotoCadree } from '@/components/essayage/photo-cadree';
import { Bouton, LienDiscret } from '@/components/ui';

type Props = {
  url: string | null;
  /** L'essayage a déjà été lancé (rouvert depuis l'historique) : on va chercher le résultat. */
  dejaLance: boolean;
  etape: string | null;
  messages: string[];
  occupe: boolean;
  onEssayer: () => void;
  onAutre: () => void;
};

// Le vêtement choisi, avant l'essayage, puis l'attente pendant la génération.
export function VetementPret({ url, dejaLance, etape, messages, occupe, onEssayer, onAutre }: Props) {
  return (
    <>
      <PhotoCadree uri={url} />
      {etape && <AttenteEssayage etape={etape} messages={messages} />}
      <Bouton label={dejaLance ? 'Voir le résultat' : 'M’essayer ce vêtement'} chargement={occupe} onPress={onEssayer} />
      {!occupe && <LienDiscret label="Choisir un autre vêtement" onPress={onAutre} />}
    </>
  );
}
