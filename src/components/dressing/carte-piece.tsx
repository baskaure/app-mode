import { ThemedText } from '@/components/themed-text';
import { ActionIcone, CarteVignette, ICONES } from '@/components/ui';
import type { Piece } from '@/lib/dressing';

// « ton jean droit bleu » → « Jean droit bleu ».
function nomPiece(piece: Piece): string {
  if (piece.description) return piece.description.replace(/^(ton|ta|tes) /, '').replace(/^./, (c) => c.toUpperCase());
  return piece.analyse_at ? 'Pièce non reconnue' : 'Analyse en cours…';
}

// Une pièce du dressing : sa photo, ce que l'IA y a reconnu, et l'icône pour la retirer.
export function CartePiece({ piece, onRetirer }: { piece: Piece; onRetirer: () => void }) {
  return (
    <CarteVignette
      uri={piece.url}
      label={nomPiece(piece)}
      action={<ActionIcone nom={ICONES.supprimer} label="Retirer cette pièce" surPhoto onPress={onRetirer} />}>
      <ThemedText type="small" numberOfLines={2} themeColor={piece.description ? 'text' : 'textSecondary'}>
        {nomPiece(piece)}
      </ThemedText>
    </CarteVignette>
  );
}
