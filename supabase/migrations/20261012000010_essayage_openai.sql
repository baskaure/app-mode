-- Essayage par OpenAI (gpt-image-2.5-sunburst) à la place de Kling, le 12 oct. 2026.
-- Le coût d'une image dépend des jetons consommés : on garde l'usage renvoyé par OpenAI et le coût estimé,
-- pour vérifier le budget d'environ 1 € par abonné et par mois. Écrit seulement par le serveur (service_role).
alter table public.essayages_journal
  add column usage jsonb,
  add column cout_usd numeric(10, 5);

comment on column public.essais.kling_task_id is 'Inutilisée depuis le passage à OpenAI (12 oct. 2026).';
