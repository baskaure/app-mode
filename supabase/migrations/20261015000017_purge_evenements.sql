-- Purge automatique de la mesure du parcours (15 oct. 2026) : les événements de plus de 13 mois sont effacés
-- chaque nuit. La politique de confidentialité (section 3) promet cette durée maximale.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'purge-evenements-13-mois',
  '17 3 * * *',
  $$delete from public.evenements where created_at < now() - interval '13 months'$$
);
