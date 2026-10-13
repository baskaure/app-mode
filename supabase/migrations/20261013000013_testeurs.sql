-- Comptes de test (13 oct. 2026) : essayages sans paiement ni plafond, pour les tests de l'équipe.
-- Table à part : `profils` est modifiable par l'app, un drapeau là-bas serait réglable par n'importe qui.
-- Seul le serveur (service_role) lit et écrit cette table. Pour ajouter un compte :
--   insert into public.testeurs (user_id, note) values ('<id affiché dans « Supprimer toutes mes données »>', '…');
create table public.testeurs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);
alter table public.testeurs enable row level security;
revoke all on public.testeurs from anon, authenticated;
