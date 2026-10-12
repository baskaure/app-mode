-- Marchands dont le programme d'affiliation est accepté (Awin). Rempli à la main (tableau de bord Supabase) :
-- une ligne par marchand, avec son identifiant d'annonceur Awin (« awinmid »).
-- L'app lit la liste pour fabriquer le lien d'achat ; personne ne peut l'écrire depuis l'app.
create table public.marchands_affilies (
  domaine text primary key check (domaine = lower(domaine) and domaine !~ '^www\.'),
  nom text not null,
  reseau text not null default 'awin' check (reseau in ('awin')),
  id_annonceur text not null,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.marchands_affilies enable row level security;
revoke insert, update, delete on public.marchands_affilies from anon, authenticated;

create policy "marchands : lire les actifs" on public.marchands_affilies
  for select to authenticated
  using (actif);
