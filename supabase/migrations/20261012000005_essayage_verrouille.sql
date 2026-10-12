-- Verrous de l'essayage (relecture du 12 oct. 2026) :
-- 1. L'app ne peut plus écrire les colonnes du serveur (statut, kling_task_id, lance_at, resultat_path, message).
--    Elle crée un essai avec les seules colonnes du vêtement ; tout le reste passe par l'Edge Function (service_role).
-- 2. Le plafond mensuel se compte dans un journal que l'utilisateur ne peut ni modifier ni vider.
-- 3. Les images vérifiées sont figées dans un bucket sans accès utilisateur : Kling lit exactement ce qui a été vérifié.

revoke insert, update on public.essais from anon, authenticated;
grant insert (source, vetement_bucket, vetement_path, lien_url, piece_id) on public.essais to authenticated;

create table public.essayages_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  essai_id uuid not null,
  created_at timestamptz not null default now()
);
create index essayages_journal_user_mois_idx on public.essayages_journal (user_id, created_at);

alter table public.essayages_journal enable row level security;
revoke insert, update, delete on public.essayages_journal from anon, authenticated;

create policy "journal : lire le sien" on public.essayages_journal
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Aucune policy : seul le serveur (service_role) lit et écrit ce bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('figes', 'figes', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);
