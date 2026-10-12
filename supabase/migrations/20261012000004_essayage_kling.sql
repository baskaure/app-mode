-- Essayage par l'API Kling (Virtual Try-on) : identifiant de tâche, et bucket privé des résultats.
-- Kling efface ses résultats au bout de 30 jours : on copie l'image dans `essayages`.

alter table public.essais
  add column kling_task_id text,
  add column lance_at timestamptz;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('essayages', 'essayages', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']);

create policy "essayages : lire les siens" on storage.objects
  for select to authenticated
  using (bucket_id = 'essayages' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "essayages : enregistrer les siens" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'essayages' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "essayages : supprimer les siens" on storage.objects
  for delete to authenticated
  using (bucket_id = 'essayages' and (storage.foldername(name))[1] = (select auth.uid())::text);
