-- Liste d'attente du site akalie.app (15 oct. 2026) : une adresse e-mail pour être prévenu du lancement.
-- Le site n'a pas de compte : il appelle la fonction inscrire_liste_attente avec la clé publique (rôle anon).
-- La table reste fermée (ni lecture ni écriture directe) ; seule la fonction y insère, après contrôle.

create table public.liste_attente (
  id bigint generated always as identity primary key,
  email text not null unique check (email = lower(email) and length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  source text check (source is null or length(source) <= 40),
  -- La case « prévenez-moi » est cochée au moment de l'inscription : la date fait foi du consentement.
  consentement_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.liste_attente enable row level security;
revoke all on public.liste_attente from anon, authenticated;

-- Renvoie 'ok', 'invalide' ou 'trop'. Une adresse déjà inscrite renvoie aussi 'ok' : le site ne révèle pas
-- qui est inscrit. Au-delà de 30 inscriptions par minute (tous visiteurs confondus), on refuse : frein aux robots.
create function public.inscrire_liste_attente(p_email text, p_source text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  e text := lower(trim(p_email));
begin
  if e is null or length(e) > 254 or e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return 'invalide';
  end if;
  if (select count(*) from public.liste_attente where created_at > now() - interval '1 minute') >= 30 then
    return 'trop';
  end if;
  insert into public.liste_attente (email, source) values (e, left(nullif(trim(p_source), ''), 40))
  on conflict (email) do nothing;
  return 'ok';
end;
$$;
revoke execute on function public.inscrire_liste_attente(text, text) from public;
grant execute on function public.inscrire_liste_attente(text, text) to anon, authenticated;
