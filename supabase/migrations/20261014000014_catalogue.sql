-- Catalogue d'articles (14 oct. 2026) : de vrais articles avec image, marque, prix et lien d'achat,
-- proposés selon le style (questionnaire) puis selon le dressing.
-- Deux sources :
--   'awin' : flux produits d'affiliation, importés par scripts/importer-awin.ts (images autorisées par le réseau) ;
--   'test' : sélection relevée à la main pour les tests internes. Les images appartiennent aux marques :
--            visibles des seuls testeurs (table testeurs), jamais du public. À vider avant la publication.
-- L'app lit seulement ; l'écriture passe par le serveur (service_role).

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('awin', 'test')),
  id_source text not null,
  marchand text not null,
  marque text,
  nom text not null,
  prix numeric(10, 2) check (prix >= 0),
  devise text not null default 'EUR',
  image_url text not null check (image_url ~ '^https://'),
  lien text not null check (lien ~ '^https://'),
  categorie text not null check (categorie in ('haut', 'bas', 'robe', 'veste', 'chaussures', 'accessoire')),
  couleur text check (couleur in ('noir', 'blanc', 'beige', 'gris', 'marine', 'bleu', 'marron', 'kaki', 'vert',
                                  'rouge', 'rose', 'jaune', 'violet', 'orange', 'motif')),
  vestiaire text not null check (vestiaire in ('femme', 'homme', 'mixte')),
  styles text[] not null default '{}',
  actif boolean not null default true,
  maj_at timestamptz not null default now(),
  unique (source, id_source)
);
create index articles_vestiaire_idx on public.articles (vestiaire) where actif;

alter table public.articles enable row level security;
revoke insert, update, delete on public.articles from anon, authenticated;

-- Vrai si la session courante est un compte de test. `testeurs` est fermée à l'app : on la lit avec les droits
-- du propriétaire de la fonction. Rangée dans le schéma `prive`, que l'API n'expose pas (pas d'appel /rpc).
create schema if not exists prive;
revoke all on schema prive from public;
grant usage on schema prive to authenticated;

create function prive.est_testeur() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.testeurs where user_id = (select auth.uid()));
$$;
revoke execute on function prive.est_testeur() from public, anon;
grant execute on function prive.est_testeur() to authenticated;

create policy "articles : lecture" on public.articles
  for select to authenticated
  using (actif and (source <> 'test' or (select prive.est_testeur())));

-- Pièces du dressing : l'IA remplit categorie, couleur et description (Edge Function analyser-piece).
-- analyse_at marque une pièce déjà regardée, même si ce n'était pas un vêtement (pas de nouvel essai en boucle).
alter table public.pieces add column analyse_at timestamptz;
alter table public.pieces add constraint pieces_couleur_check check (
  couleur is null or couleur in ('noir', 'blanc', 'beige', 'gris', 'marine', 'bleu', 'marron', 'kaki', 'vert',
                                 'rouge', 'rose', 'jaune', 'violet', 'orange', 'motif')
);
