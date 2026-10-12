-- « J'aime / j'aime pas » sur un essayage (BRIEF, parcours V1 étape 6). Servira plus tard à proposer des
-- vêtements dans le goût de la personne.
-- L'app ne peut écrire QUE ces deux colonnes : le reste de `essais` reste réservé au serveur (migration 000005).
alter table public.essais
  add column avis text check (avis in ('aime', 'aime_pas')),
  add column avis_at timestamptz;

grant update (avis, avis_at) on public.essais to authenticated;
