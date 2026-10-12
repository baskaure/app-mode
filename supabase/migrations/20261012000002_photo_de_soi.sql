-- Photo de soi pour l'essayage : bucket privé séparé des vêtements, consentement daté dans le profil.

alter table public.profils
  add column photo_soi_path text,
  add column consentement_photo_at timestamptz;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('silhouettes', 'silhouettes', false, 2097152, array['image/jpeg']);

create policy "silhouette : lire la sienne" on storage.objects
  for select to authenticated
  using (bucket_id = 'silhouettes' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "silhouette : envoyer la sienne" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'silhouettes' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "silhouette : supprimer la sienne" on storage.objects
  for delete to authenticated
  using (bucket_id = 'silhouettes' and (storage.foldername(name))[1] = (select auth.uid())::text);
