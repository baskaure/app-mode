-- Étiquetage des articles par l'IA (16 oct. 2026) : Edge Function etiqueter-articles, appelée par l'import.
-- nom_court : nom propre et court affiché dans l'app (« Blazer cintré noir ») à la place du titre du marchand.
-- coupe : coupe reconnue, pour les conseils de silhouette (avant : mots cherchés dans le titre).
-- etiquete_at : null = pas encore vu par l'IA. Un article jugé hors sujet (enfant, déguisement, accessoire
-- maison…) est désactivé (actif = false) au moment de l'étiquetage.
alter table public.articles
  add column nom_court text check (char_length(nom_court) <= 60),
  add column coupe text check (coupe in ('droit', 'large', 'slim', 'evase', 'oversize', 'cintre', 'ample', 'court', 'long')),
  add column etiquete_at timestamptz;

create index articles_a_etiqueter_idx on public.articles (maj_at) where etiquete_at is null and actif;
