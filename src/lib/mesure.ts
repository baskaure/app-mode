// Note une étape du parcours dans la table evenements (migration 000016). Sans effet bloquant : une mesure
// ratée ne gêne jamais l'utilisateur. Rien d'autre que le nom de l'étape et l'heure n'est envoyé.
import type { Evenement } from '@/lib/mesure-etapes';
import { supabase } from '@/lib/supabase';

// Étapes qui ne comptent qu'une fois par lancement de l'app (un écran revu ne gonfle pas l'entonnoir).
const UNE_FOIS_PAR_LANCEMENT: ReadonlySet<Evenement> = new Set(['questionnaire_ouvert', 'paywall_vu']);
const dejaNotes = new Set<Evenement>();

async function envoyer(nom: Evenement, essai: number): Promise<void> {
  const { data } = await supabase.auth.getSession();
  // Au tout premier lancement, le compte anonyme peut ne pas être encore créé : on réessaie un peu plus tard.
  if (!data.session) {
    if (essai < 3) setTimeout(() => void envoyer(nom, essai + 1), 3000);
    return;
  }
  await supabase.from('evenements').insert({ nom });
}

export function noter(nom: Evenement): void {
  if (UNE_FOIS_PAR_LANCEMENT.has(nom)) {
    if (dejaNotes.has(nom)) return;
    dejaNotes.add(nom);
  }
  envoyer(nom, 0).catch(() => {
    // mesure perdue : sans importance pour l'utilisateur
  });
}
