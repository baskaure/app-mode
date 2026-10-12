-- Schéma initial de app-mode : profils, pièces du dressing, tenues.
-- Chaque utilisateur ne voit et ne modifie que ses propres lignes (RLS).

create table public.profils (
  id uuid primary key references auth.users (id) on delete cascade,
  vestiaire text check (vestiaire in ('femme', 'homme')),
  age smallint check (age between 15 and 120),
  style text,
  gene text,
  epaules_hanches text check (epaules_hanches in ('epaules_plus_larges', 'pareil', 'hanches_plus_larges')),
  taille text check (taille in ('marquee', 'un_peu', 'pas_marquee')),
  ventre text check (ventre in ('plat', 'un_peu', 'marque')),
  silhouette text check (silhouette in ('A', 'V', 'H', 'X', 'O')),
  onboarding_fini boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pieces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  photo_path text not null,
  categorie text check (categorie in ('haut', 'bas', 'robe', 'veste', 'chaussures', 'accessoire')),
  couleur text,
  coupe text,
  matiere text,
  description text,
  created_at timestamptz not null default now()
);
create index pieces_user_id_idx on public.pieces (user_id);

create table public.tenues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  piece_ids uuid[] not null,
  pourquoi text not null,
  occasion text,
  avis smallint check (avis in (-1, 1)),
  created_at timestamptz not null default now()
);
create index tenues_user_id_idx on public.tenues (user_id);

alter table public.profils enable row level security;
alter table public.pieces enable row level security;
alter table public.tenues enable row level security;

create policy "profil : le sien" on public.profils
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "pieces : les siennes" on public.pieces
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "tenues : les siennes" on public.tenues
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Mise à jour automatique de updated_at.
create function public.maj_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profils_updated_at before update on public.profils
  for each row execute function public.maj_updated_at();

-- Photos des pièces : bucket privé, un dossier par utilisateur (<uid>/<fichier>).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pieces', 'pieces', false, 1048576, array['image/jpeg', 'image/png', 'image/webp']);

create policy "photos : lire les siennes" on storage.objects
  for select to authenticated
  using (bucket_id = 'pieces' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "photos : envoyer les siennes" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pieces' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "photos : supprimer les siennes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pieces' and (storage.foldername(name))[1] = (select auth.uid())::text);
