-- Boas-vindas: contas novas escolhem o nick (e conferem nome, foto e cor) antes de entrar no app.
alter table public.profiles add column onboarded boolean not null default false;
update public.profiles set onboarded = true;
grant update (onboarded) on public.profiles to authenticated;

-- Nick livre? (o próprio nick conta como livre para quem já o tem)
create function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = '' as $$
  select lower(btrim(coalesce(p_username, ''))) ~ '^[a-z0-9_.]{3,20}$'
    and not exists (
      select 1 from public.profiles
      where username = lower(btrim(p_username)) and id <> (select auth.uid())
    )
$$;
revoke execute on function public.username_available(text) from public, anon;
grant execute on function public.username_available(text) to authenticated;
