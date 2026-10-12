-- Essayages offerts : un compte anonyme se recrée à volonté (réinstallation), donc l'essayage offert « par compte »
-- ne borne pas le coût. On marque les essayages offerts pour les plafonner aussi au total, par jour (ESSAIS_GRATUITS_JOUR).
alter table public.essayages_journal add column gratuit boolean not null default false;
create index essayages_journal_gratuit_jour_idx on public.essayages_journal (created_at) where gratuit;
