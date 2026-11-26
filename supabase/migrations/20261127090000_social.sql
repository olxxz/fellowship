-- Social: nick único (@usuario), Cenários públicos, amizades e conversas diretas entre amigos.

-- ───────────────────────── Nick único ─────────────────────────
-- 3 a 20 caracteres: letras minúsculas, números, ponto e sublinhado. Além do id, é como as pessoas se acham.

create function private.slug_username(p_base text) returns text
language sql immutable set search_path = '' as $$
  select left(regexp_replace(
    translate(lower(coalesce(p_base, '')), 'áàâãäéèêëíìîïóòôõöúùûüçñ ', 'aaaaaeeeeiiiiooooouuuucn_'),
    '[^a-z0-9_.]', '', 'g'), 16)
$$;

-- Gera um nick livre a partir de um nome: "Ana Lima" → ana_lima, ou ana_lima1234 se já existir.
create function private.make_username(p_base text) returns text
language plpgsql set search_path = '' as $$
declare
  v_base text := private.slug_username(p_base);
  v_try text;
begin
  if char_length(v_base) < 3 then v_base := 'aventureiro'; end if;
  v_try := v_base;
  while exists (select 1 from public.profiles where username = v_try) loop
    v_try := left(v_base, 15) || lpad((floor(random() * 10000))::int::text, 4, '0');
  end loop;
  return v_try;
end;
$$;

alter table public.profiles add column username text;
do $$
declare r record;
begin
  for r in select id, display_name from public.profiles where username is null order by created_at loop
    update public.profiles set username = private.make_username(r.display_name) where id = r.id;
  end loop;
end;
$$;
alter table public.profiles
  alter column username set not null,
  add constraint profiles_username_format check (username ~ '^[a-z0-9_.]{3,20}$');
create unique index profiles_username_key on public.profiles (username);

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_name text := left(coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Aventureiro'
  ), 60);
begin
  insert into public.profiles (id, display_name, username, avatar_url, color)
  values (
    new.id,
    v_name,
    private.make_username(coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), v_name)),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    (array['#4fb3a9', '#e07a5f', '#a99cf5', '#d4a24c', '#5b8def', '#7ee0a1'])[1 + floor(random() * 6)::int]
  );
  return new;
end;
$$;

grant update (username) on public.profiles to authenticated;

-- ───────────────────────── Amizades ─────────────────────────
-- Um par por linha (user_a < user_b). Pendente até a outra pessoa aceitar.

create table public.friendships (
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'aceita')),
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b),
  check (requested_by in (user_a, user_b))
);
create index friendships_user_b_idx on public.friendships (user_b);

create function private.are_friends(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.friendships
    where user_a = least(p_a, p_b) and user_b = greatest(p_a, p_b) and status = 'aceita'
  )
$$;

alter table public.friendships enable row level security;
create policy "amizades: as duas pessoas veem" on public.friendships
  for select to authenticated using ((select auth.uid()) in (user_a, user_b));
revoke all on public.friendships from anon, authenticated;
grant select on public.friendships to authenticated;

-- Perfis: amigos (e pedidos pendentes) também se veem.
drop policy "perfil: o próprio e quem divide um Cenário" on public.profiles;
create policy "perfil: o próprio, quem divide um Cenário e amigos" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or private.shares_space(id, (select auth.uid()))
    or exists (
      select 1 from public.friendships f
      where f.user_a = least(id, (select auth.uid())) and f.user_b = greatest(id, (select auth.uid()))
    )
  );

-- Cartão público de alguém pelo nick (para adicionar amigo e para o link de amizade).
create function public.find_profile(p_username text)
returns table (id uuid, username text, display_name text, avatar_url text, color text, bio text, friendship text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.color, p.bio,
    case
      when p.id = (select auth.uid()) then 'voce'
      when f.status = 'aceita' then 'amigos'
      when f.status = 'pendente' and f.requested_by = (select auth.uid()) then 'enviado'
      when f.status = 'pendente' then 'recebido'
      else 'nenhuma'
    end
  from public.profiles p
  left join public.friendships f
    on f.user_a = least(p.id, (select auth.uid())) and f.user_b = greatest(p.id, (select auth.uid()))
  where p.username = lower(btrim(ltrim(coalesce(p_username, ''), '@')))
$$;

-- Pede amizade pelo nick. Se a outra pessoa já tinha pedido, vira amizade na hora.
create function public.request_friend(p_username text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_other uuid;
  v_row public.friendships;
begin
  if v_user is null then
    raise exception 'Entre na sua conta para adicionar amigos.' using errcode = '28000';
  end if;
  select id into v_other from public.profiles where username = lower(btrim(ltrim(coalesce(p_username, ''), '@')));
  if v_other is null then
    raise exception 'Ninguém com esse nick.' using errcode = '22023';
  end if;
  if v_other = v_user then
    raise exception 'Esse nick é o seu.' using errcode = '22023';
  end if;
  select * into v_row from public.friendships where user_a = least(v_user, v_other) and user_b = greatest(v_user, v_other) for update;
  if v_row.user_a is null then
    insert into public.friendships (user_a, user_b, requested_by) values (least(v_user, v_other), greatest(v_user, v_other), v_user);
    return 'enviado';
  end if;
  if v_row.status = 'aceita' then return 'amigos'; end if;
  if v_row.requested_by = v_user then return 'enviado'; end if;
  update public.friendships set status = 'aceita' where user_a = v_row.user_a and user_b = v_row.user_b;
  return 'amigos';
end;
$$;

create function public.respond_friend(p_other uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
begin
  if p_accept then
    update public.friendships set status = 'aceita'
    where user_a = least(v_user, p_other) and user_b = greatest(v_user, p_other) and status = 'pendente' and requested_by = p_other;
  else
    delete from public.friendships
    where user_a = least(v_user, p_other) and user_b = greatest(v_user, p_other) and status = 'pendente';
  end if;
end;
$$;

create function public.remove_friend(p_other uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.friendships
  where user_a = least((select auth.uid()), p_other) and user_b = greatest((select auth.uid()), p_other)
$$;

-- ───────────────────────── Conversas diretas ─────────────────────────
-- Só entre amigos. A conversa é o par (user_a < user_b).

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  check (author_id in (user_a, user_b))
);
create index direct_messages_pair_idx on public.direct_messages (user_a, user_b, created_at desc);

alter table public.direct_messages enable row level security;
create policy "conversa: as duas pessoas leem" on public.direct_messages
  for select to authenticated using ((select auth.uid()) in (user_a, user_b));
create policy "conversa: amigos escrevem como si mesmos" on public.direct_messages
  for insert to authenticated
  with check (author_id = (select auth.uid()) and private.are_friends(user_a, user_b));
create policy "conversa: apagar as próprias" on public.direct_messages
  for delete to authenticated using (author_id = (select auth.uid()));
revoke all on public.direct_messages from anon, authenticated;
grant select, delete on public.direct_messages to authenticated;
grant insert (user_a, user_b, author_id, content) on public.direct_messages to authenticated;

alter table public.direct_messages replica identity full;
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
end;
$$;

-- ───────────────────────── Cenários públicos ─────────────────────────
-- Públicos aparecem em Explorar para todo mundo; qualquer conta entra sem convite.

alter table public.spaces add column is_public boolean not null default false;
grant update (is_public) on public.spaces to authenticated;

create function public.list_public_spaces(p_query text default null)
returns table (id uuid, name text, short text, description text, color text, member_count integer, is_member boolean)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, s.short, s.description, s.color,
    (select count(*)::int from public.space_members m where m.space_id = s.id),
    private.is_space_member(s.id, (select auth.uid()))
  from public.spaces s
  where s.is_public
    and (p_query is null or btrim(p_query) = '' or s.name ilike '%' || btrim(p_query) || '%')
  order by 6 desc, s.created_at desc
  limit 60
$$;

create function public.join_public_space(p_space uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'Entre na sua conta para entrar no Cenário.' using errcode = '28000';
  end if;
  if not exists (select 1 from public.spaces where id = p_space and is_public) then
    raise exception 'Este Cenário não é público.' using errcode = '42501';
  end if;
  if private.is_space_member(p_space, v_user) then return p_space; end if;
  insert into public.space_members (space_id, user_id) values (p_space, v_user);
  insert into public.member_roles (space_id, user_id, role_id)
  select p_space, v_user, r.id from public.roles r where r.space_id = p_space and r.granted_on_join;
  return p_space;
end;
$$;

-- ───────────────────────── Permissões das funções ─────────────────────────
revoke all on function private.slug_username(text), private.make_username(text) from public, anon, authenticated;
revoke all on function private.are_friends(uuid, uuid) from public, anon;
grant execute on function private.are_friends(uuid, uuid) to authenticated;
revoke execute on function public.find_profile(text), public.request_friend(text), public.respond_friend(uuid, boolean),
  public.remove_friend(uuid), public.list_public_spaces(text), public.join_public_space(uuid) from public, anon;
grant execute on function public.find_profile(text), public.request_friend(text), public.respond_friend(uuid, boolean),
  public.remove_friend(uuid), public.list_public_spaces(text), public.join_public_space(uuid) to authenticated;
