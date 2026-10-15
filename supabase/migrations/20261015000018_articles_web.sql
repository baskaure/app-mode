-- Source 'web' (15 oct. 2026) : articles Google Shopping via SerpApi (scripts/importer-web.mjs), visibles de tous,
-- affichés « Trouvé sur le web » avec un lien vers les offres. Remplacés par Awin au fil des accords de marques.
alter table public.articles drop constraint articles_source_check;
alter table public.articles add constraint articles_source_check check (source in ('awin', 'test', 'web'));
