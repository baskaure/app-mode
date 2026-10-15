-- Mesure du parcours (15 oct. 2026) : où les gens décrochent entre le questionnaire et l'abonnement.
-- Pas d'outil tiers : chaque étape est une ligne ici. L'app peut seulement écrire SES lignes, jamais lire.
-- La suppression du compte efface tout (clé étrangère en cascade sur auth.users).
-- La liste des noms doit rester identique à src/lib/mesure-etapes.ts (vérifié par mesure-etapes.test.ts).

create table public.evenements (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nom text not null check (nom in (
    'questionnaire_ouvert', 'questionnaire_fini', 'photo_ajoutee', 'vetement_choisi', 'essai_lance',
    'essai_reussi', 'paywall_vu', 'abonnement',
    'piece_ajoutee', 'article_ouvert', 'story_partagee'
  )),
  created_at timestamptz not null default now()
);
create index evenements_nom_date_idx on public.evenements (nom, created_at);

alter table public.evenements enable row level security;
revoke all on public.evenements from anon, authenticated;
grant insert (nom) on public.evenements to authenticated;

create policy "evenements : écrire les siens" on public.evenements
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Entonnoir sur les N derniers jours : nombre de personnes distinctes à chaque étape.
-- Dans le schéma `prive` (non exposé à l'API) : lu seulement depuis le tableau de bord ou par Claude en SQL.
create function prive.entonnoir(jours integer default 30)
returns table (etape text, personnes bigint)
language sql stable security definer set search_path = '' as $$
  select e.nom, count(distinct e.user_id)
  from public.evenements e
  where e.created_at > now() - make_interval(days => jours)
  group by e.nom;
$$;
revoke execute on function prive.entonnoir(integer) from public, anon, authenticated;
