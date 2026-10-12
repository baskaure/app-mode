-- Raison technique d'un échec d'essayage (réponse d'OpenAI, par exemple), écrite par le serveur seul.
-- Les journaux des Edge Functions arrivent avec plusieurs minutes de retard : cette colonne permet de diagnostiquer tout de suite.
alter table public.essais add column erreur_technique text;
