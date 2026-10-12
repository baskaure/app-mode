-- Essais : un vêtement choisi pour être essayé sur la photo de soi.
-- Le vêtement vient d'une photo envoyée, d'un lien d'article ou d'une pièce du dressing.

create table public.essais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source text not null check (source in ('photo', 'lien', 'dressing')),
  vetement_path text not null,
  lien_url text,
  piece_id uuid references public.pieces (id) on delete set null,
  statut text not null default 'a_faire' check (statut in ('a_faire', 'en_cours', 'fait', 'refuse', 'erreur')),
  resultat_path text,
  message text,
  created_at timestamptz not null default now()
);
create index essais_user_id_idx on public.essais (user_id);
create index essais_piece_id_idx on public.essais (piece_id);

alter table public.essais enable row level security;

create policy "essais : les siens" on public.essais
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Images des vêtements à essayer (photo envoyée ou image récupérée depuis un lien).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vetements', 'vetements', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "vetements : lire les siens" on storage.objects
  for select to authenticated
  using (bucket_id = 'vetements' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "vetements : envoyer les siens" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vetements' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "vetements : supprimer les siens" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vetements' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Une pièce du dressing reste dans son bucket `pieces` : on note dans quel bucket lire l'image.
alter table public.essais
  add column vetement_bucket text not null default 'vetements' check (vetement_bucket in ('vetements', 'pieces'));
