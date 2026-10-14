import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BarreProgression, Choix, LienDiscret } from '@/components/ui';
import { Espace } from '@/constants/theme';

type Props = {
  numero: number;
  total: number;
  question: string;
  options: { label: string; valeur: string }[];
  onChoix: (valeur: string) => void;
  /** Revenir à la question précédente (absent à la première question). */
  onRetour?: () => void;
};

// Une question du questionnaire : l'avancement, la question, les réponses à toucher.
export function Question({ numero, total, question, options, onChoix, onRetour }: Props) {
  return (
    <>
      <View style={styles.progression}>
        <BarreProgression valeur={numero / total} />
        <ThemedText type="eyebrow">
          Question {numero} sur {total}
        </ThemedText>
      </View>
      <ThemedText type="subtitle">{question}</ThemedText>
      <View style={styles.options}>
        {options.map((o) => (
          <Choix key={o.valeur} label={o.label} onPress={() => onChoix(o.valeur)} />
        ))}
      </View>
      {onRetour && <LienDiscret label="Question précédente" onPress={onRetour} />}
    </>
  );
}

const styles = StyleSheet.create({
  progression: { gap: Espace.m, marginTop: Espace.s },
  options: { gap: Espace.m },
});
