-- Essayage via Kie.ai (13 oct. 2026) : la colonne de l'identifiant de tâche sert de nouveau, sous un nom neutre.
alter table public.essais rename column kling_task_id to tache_id;
comment on column public.essais.tache_id is 'Identifiant de la tâche chez le service d''image (Kie.ai).';
