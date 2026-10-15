-- Appareils à prévenir quand un essayage est prêt (15 oct. 2026) : jeton de notification Expo par téléphone.
-- L'app ne lit ni n'écrit la table directement : elle passe par enregistrer_appareil(), qui rattache le jeton
-- au compte courant (un téléphone qui change de compte, après « Supprimer mes données », change de propriétaire).
-- Le serveur (fonction essayage, service_role) lit les jetons pour envoyer la notification.
create table public.appareils (
  jeton_push text primary key check (jeton_push ~ '^Expo(nent)?PushToken\[[^\]]{10,200}\]$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  maj_at timestamptz not null default now()
);
create index appareils_user_idx on public.appareils (user_id);

alter table public.appareils enable row level security;
revoke all on public.appareils from anon, authenticated;

create function public.enregistrer_appareil(jeton text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then
    raise exception 'session requise';
  end if;
  insert into public.appareils (jeton_push, user_id) values (jeton, (select auth.uid()))
  on conflict (jeton_push) do update set user_id = excluded.user_id, maj_at = now();
end;
$$;
revoke execute on function public.enregistrer_appareil(text) from public, anon;
grant execute on function public.enregistrer_appareil(text) to authenticated;
