-- La date de l'avis est posée par la base, pas par le téléphone (dont l'horloge peut être fausse).
-- L'app n'écrit plus que `avis`.
create function public.dater_avis() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.avis_at := case when new.avis is null then null else now() end;
  return new;
end;
$$;

create trigger essais_dater_avis
  before update of avis on public.essais
  for each row execute function public.dater_avis();

revoke update (avis_at) on public.essais from authenticated;
