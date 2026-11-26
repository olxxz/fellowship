-- Fellowship · fase 0: perfis, Cenários, cargos, categorias, canais, permissões e mensagens.
-- Regras de acesso (RLS) por Cenário desde o primeiro dia. Ver docs/adr/0014-conflito-de-cargos.md.
--
-- Permissões (bitmask). Mantenha igual a packages/core/src/permissions.ts:
--   1 ver canal · 2 enviar mensagens · 4 falar em voz · 8 publicar anúncios · 16 gerenciar mensagens
--   32 criar convites · 64 criar campanhas · 128 gerenciar compêndio · 256 gerenciar canais
--   512 gerenciar cargos · 1024 gerenciar tema · 2047 todas

create schema if not exists private;
revoke all on schema private from public;

-- ───────────────────────── Tabelas ─────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_url text,
  color smallint not null default 1 check (color between 1 and 6),
  bio text check (char_length(bio) <= 300),
  created_at timestamptz not null default now()
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'cenario' check (kind in ('cenario', 'comunidade')),
  name text not null check (char_length(name) between 2 and 60),
  short text not null check (char_length(short) between 1 and 3),
  description text check (char_length(description) <= 300),
  color smallint not null default 4 check (color between 1 and 6),
  owner_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  color smallint check (color between 1 and 6),
  position integer not null default 0,
  permissions integer not null default 0,
  -- O cargo padrão vale para todos os membros do Cenário.
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, space_id)
);
create unique index roles_one_default_per_space on public.roles (space_id) where is_default;

create table public.space_members (
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  nickname text check (char_length(nickname) <= 40),
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id)
);
create index space_members_user_idx on public.space_members (user_id);

create table public.member_roles (
  space_id uuid not null,
  user_id uuid not null,
  role_id uuid not null,
  primary key (user_id, role_id),
  foreign key (space_id, user_id) references public.space_members (space_id, user_id) on delete cascade,
  foreign key (role_id, space_id) references public.roles (id, space_id) on delete cascade
);
create index member_roles_space_user_idx on public.member_roles (space_id, user_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  position integer not null default 0,
  unique (id, space_id)
);

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  category_id uuid,
  kind text not null check (kind in ('texto', 'anuncios', 'galeria', 'voz', 'voz_dinamica', 'funcional')),
  name text not null check (char_length(name) between 1 and 40),
  topic text check (char_length(topic) <= 200),
  -- Nome semântico do ícone (announcement, rules, calendar…). Vazio: o app escolhe pelo tipo.
  icon text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, space_id),
  foreign key (category_id, space_id) references public.categories (id, space_id) on delete set null (category_id)
);
create index channels_space_idx on public.channels (space_id);

create table public.permission_overrides (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  category_id uuid references public.categories (id) on delete cascade,
  channel_id uuid references public.channels (id) on delete cascade,
  role_id uuid references public.roles (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  allow integer not null default 0,
  deny integer not null default 0,
  check ((category_id is null) <> (channel_id is null)),
  check ((role_id is null) <> (user_id is null))
);
create unique index permission_overrides_target_idx
  on public.permission_overrides (coalesce(category_id, channel_id), coalesce(role_id, user_id));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  channel_id uuid not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  scope text not null default 'outgame' check (scope in ('ingame', 'outgame')),
  kind text not null default 'texto' check (kind in ('texto', 'rolagem', 'sistema')),
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  foreign key (channel_id, space_id) references public.channels (id, space_id) on delete cascade
);
create index messages_channel_created_idx on public.messages (channel_id, created_at desc);

-- ───────────────────────── Perfil automático ─────────────────────────

-- Cada conta nova (Google ou outro provedor) ganha um perfil com nome, foto e uma cor de personagem.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url, color)
  values (
    new.id,
    left(coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Aventureiro'
    ), 60),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    1 + floor(random() * 6)::int
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ───────────────────────── Permissões ─────────────────────────

create function private.is_space_member(p_space uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.space_members where space_id = p_space and user_id = p_user);
$$;

create function private.space_permissions(p_space uuid, p_user uuid) returns integer
language plpgsql stable security definer set search_path = '' as $$
declare
  v_owner uuid;
begin
  if p_user is null then
    return 0;
  end if;
  select owner_id into v_owner from public.spaces where id = p_space;
  if v_owner is null then
    return 0;
  end if;
  if v_owner = p_user then
    return 2047;
  end if;
  if not private.is_space_member(p_space, p_user) then
    return 0;
  end if;
  return coalesce((
    select bit_or(r.permissions)
    from public.roles r
    where r.space_id = p_space
      and (r.is_default or exists (select 1 from public.member_roles mr where mr.role_id = r.id and mr.user_id = p_user))
  ), 0);
end;
$$;

-- Regra da ADR 0014: base dos cargos → categoria → canal; em cada nível, nega dos cargos, libera dos cargos, ajuste da pessoa.
create function private.channel_permissions(p_channel uuid, p_user uuid) returns integer
language plpgsql stable security definer set search_path = '' as $$
declare
  v_space uuid;
  v_category uuid;
  v_owner uuid;
  v_perms integer;
  v_allow integer;
  v_deny integer;
  v_target uuid;
begin
  if p_user is null then
    return 0;
  end if;
  select c.space_id, c.category_id, s.owner_id into v_space, v_category, v_owner
  from public.channels c join public.spaces s on s.id = c.space_id
  where c.id = p_channel;
  if v_space is null then
    return 0;
  end if;
  if v_owner = p_user then
    return 2047;
  end if;
  if not private.is_space_member(v_space, p_user) then
    return 0;
  end if;

  v_perms := private.space_permissions(v_space, p_user);

  foreach v_target in array array[v_category, p_channel] loop
    continue when v_target is null;
    select coalesce(bit_or(o.allow), 0), coalesce(bit_or(o.deny), 0) into v_allow, v_deny
    from public.permission_overrides o
    join public.roles r on r.id = o.role_id
    where coalesce(o.category_id, o.channel_id) = v_target
      and (r.is_default or exists (select 1 from public.member_roles mr where mr.role_id = r.id and mr.user_id = p_user));
    v_perms := (v_perms & ~v_deny) | v_allow;

    select coalesce(bit_or(o.allow), 0), coalesce(bit_or(o.deny), 0) into v_allow, v_deny
    from public.permission_overrides o
    where coalesce(o.category_id, o.channel_id) = v_target and o.user_id = p_user;
    v_perms := (v_perms & ~v_deny) | v_allow;
  end loop;

  if v_perms & 1 = 0 then
    return 0;
  end if;
  return v_perms;
end;
$$;

-- Versões públicas: só respondem sobre quem está logado.
create function public.is_space_member(p_space uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_space_member(p_space, (select auth.uid()));
$$;

create function public.space_permissions(p_space uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select private.space_permissions(p_space, (select auth.uid()));
$$;

create function public.channel_permissions(p_channel uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select private.channel_permissions(p_channel, (select auth.uid()));
$$;

-- Pessoas que dividem algum Cenário com quem está logado (para ver nome e foto delas).
create function private.shares_space(p_other uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.space_members a
    join public.space_members b on b.space_id = a.space_id
    where a.user_id = p_user and b.user_id = p_other
  );
$$;

-- Postar exige ver o canal e enviar mensagens; anúncios exigem também publicar anúncios.
create function private.can_post(p_channel uuid, p_user uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_kind text;
  v_perms integer;
begin
  select kind into v_kind from public.channels where id = p_channel;
  if v_kind is null or v_kind not in ('texto', 'anuncios') then
    return false;
  end if;
  v_perms := private.channel_permissions(p_channel, p_user);
  if v_perms & 2 = 0 then
    return false;
  end if;
  return v_kind <> 'anuncios' or v_perms & 8 <> 0;
end;
$$;

-- ───────────────────────── Criar Cenário ─────────────────────────

create function public.create_space(
  p_name text,
  p_description text default null,
  p_color smallint default 4,
  p_template text default 'padrao'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_name text := btrim(coalesce(p_name, ''));
  v_short text;
  v_space uuid;
  v_member_role uuid;
  v_mural uuid;
  v_conversa uuid;
  v_voz uuid;
begin
  if v_user is null then
    raise exception 'É preciso entrar para criar um Cenário.' using errcode = '28000';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 60 then
    raise exception 'O nome do Cenário precisa ter entre 2 e 60 caracteres.' using errcode = '22023';
  end if;
  if p_template not in ('padrao', 'vazio') then
    raise exception 'Modelo de canais desconhecido.' using errcode = '22023';
  end if;
  if p_color is null or p_color not between 1 and 6 then
    raise exception 'Cor inválida.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = v_user) then
    raise exception 'Perfil não encontrado.' using errcode = '22023';
  end if;

  -- Iniciais para o ícone: primeiras letras das duas primeiras palavras, ignorando "de", "da"…
  select upper(string_agg(left(w, 1), '' order by n)) into v_short
  from (
    select w, n from regexp_split_to_table(v_name, '\s+') with ordinality as t (w, n)
    where w <> '' and lower(w) not in ('de', 'da', 'do', 'das', 'dos', 'e', 'o', 'a', 'os', 'as', 'the', 'of')
    order by n
    limit 2
  ) words;
  v_short := coalesce(nullif(v_short, ''), upper(left(v_name, 2)));

  insert into public.spaces (name, short, description, color, owner_id)
  values (v_name, v_short, nullif(btrim(coalesce(p_description, '')), ''), p_color, v_user)
  returning id into v_space;

  insert into public.space_members (space_id, user_id) values (v_space, v_user);

  -- Cargos padrão (spec: Dono é o owner_id; Administrador, Narrador, Membro e Visitante).
  insert into public.roles (space_id, name, color, position, permissions, is_default) values
    (v_space, 'Administrador', 3, 4, 2047, false),
    (v_space, 'Narrador', 4, 3, 1 | 2 | 4 | 8 | 32 | 64 | 128, false),
    (v_space, 'Visitante', null, 0, 1, true);
  insert into public.roles (space_id, name, color, position, permissions)
  values (v_space, 'Membro', 1, 1, 1 | 2 | 4 | 32)
  returning id into v_member_role;

  insert into public.member_roles (space_id, user_id, role_id) values (v_space, v_user, v_member_role);

  if p_template = 'padrao' then
    insert into public.categories (space_id, name, position) values (v_space, 'Mural', 0) returning id into v_mural;
    insert into public.categories (space_id, name, position) values (v_space, 'Conversa', 1) returning id into v_conversa;
    insert into public.categories (space_id, name, position) values (v_space, 'Voz', 2) returning id into v_voz;
    insert into public.channels (space_id, category_id, kind, name, icon, topic, position) values
      (v_space, v_mural, 'anuncios', 'Anúncios', 'announcement', 'Avisos para todo o Cenário.', 0),
      (v_space, v_mural, 'funcional', 'Regras', 'rules', 'Regras da casa e ferramentas de segurança.', 1),
      (v_space, v_mural, 'funcional', 'Agenda', 'calendar', 'Próximas sessões e enquetes de data.', 2),
      (v_space, v_conversa, 'texto', 'Geral', 'chat', 'Conversa do grupo fora do jogo.', 0),
      (v_space, v_conversa, 'galeria', 'Arte e fichas', 'gallery', 'Retratos, mapas e handouts.', 1),
      (v_space, v_voz, 'voz', 'Taverna', 'voice', 'Sala de voz para conversar.', 0);
  else
    insert into public.categories (space_id, name, position) values (v_space, 'Conversa', 0) returning id into v_conversa;
    insert into public.channels (space_id, category_id, kind, name, icon, topic, position)
    values (v_space, v_conversa, 'texto', 'Geral', 'chat', 'Conversa do grupo.', 0);
  end if;

  return v_space;
end;
$$;

-- ───────────────────────── RLS ─────────────────────────

alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.roles enable row level security;
alter table public.space_members enable row level security;
alter table public.member_roles enable row level security;
alter table public.categories enable row level security;
alter table public.channels enable row level security;
alter table public.permission_overrides enable row level security;
alter table public.messages enable row level security;

create policy "perfil: o próprio e quem divide um Cenário" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.shares_space(id, (select auth.uid())));
create policy "perfil: editar o próprio" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "cenário: membros veem" on public.spaces
  for select to authenticated using (private.is_space_member(id, (select auth.uid())));
create policy "cenário: dono edita" on public.spaces
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "cenário: dono apaga" on public.spaces
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "membros: membros veem" on public.space_members
  for select to authenticated using (private.is_space_member(space_id, (select auth.uid())));
create policy "cargos: membros veem" on public.roles
  for select to authenticated using (private.is_space_member(space_id, (select auth.uid())));
create policy "cargos dos membros: membros veem" on public.member_roles
  for select to authenticated using (private.is_space_member(space_id, (select auth.uid())));
create policy "categorias: membros veem" on public.categories
  for select to authenticated using (private.is_space_member(space_id, (select auth.uid())));

create policy "canais: quem pode ver o canal" on public.channels
  for select to authenticated using (private.channel_permissions(id, (select auth.uid())) & 1 <> 0);

create policy "ajustes: quem gerencia canais" on public.permission_overrides
  for select to authenticated using (private.space_permissions(space_id, (select auth.uid())) & 256 <> 0);

create policy "mensagens: quem pode ver o canal" on public.messages
  for select to authenticated using (private.channel_permissions(channel_id, (select auth.uid())) & 1 <> 0);
create policy "mensagens: postar como si mesmo onde pode" on public.messages
  for insert to authenticated
  with check (author_id = (select auth.uid()) and kind = 'texto' and private.can_post(channel_id, (select auth.uid())));
create policy "mensagens: apagar as próprias ou gerenciando" on public.messages
  for delete to authenticated
  using (author_id = (select auth.uid()) or private.channel_permissions(channel_id, (select auth.uid())) & 16 <> 0);

-- ───────────────────────── Privilégios ─────────────────────────
-- Menor privilégio: nada para anon; para authenticated, só o que as telas usam. RLS filtra as linhas.

revoke all on public.profiles, public.spaces, public.roles, public.space_members, public.member_roles,
  public.categories, public.channels, public.permission_overrides, public.messages from anon, authenticated;

grant select on public.profiles, public.spaces, public.roles, public.space_members, public.member_roles,
  public.categories, public.channels, public.permission_overrides, public.messages to authenticated;
grant update (display_name, avatar_url, color, bio) on public.profiles to authenticated;
grant update (name, short, description, color) on public.spaces to authenticated;
grant delete on public.spaces to authenticated;
grant insert (space_id, channel_id, author_id, scope, kind, content) on public.messages to authenticated;
grant delete on public.messages to authenticated;

-- As políticas chamam estas funções com o papel de quem consulta. O schema private não é exposto pela API
-- (só public é), então ninguém as chama diretamente com outro usuário.
revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_space_member(uuid, uuid), private.space_permissions(uuid, uuid),
  private.channel_permissions(uuid, uuid), private.shares_space(uuid, uuid), private.can_post(uuid, uuid) to authenticated;

-- O gatilho de perfil roda quando o Auth do Supabase cria a conta.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage on schema private to supabase_auth_admin;
    grant execute on function private.handle_new_user() to supabase_auth_admin;
  end if;
end;
$$;
revoke execute on function public.create_space(text, text, smallint, text) from public, anon;
revoke execute on function public.is_space_member(uuid) from public, anon;
revoke execute on function public.space_permissions(uuid) from public, anon;
revoke execute on function public.channel_permissions(uuid) from public, anon;
grant execute on function public.create_space(text, text, smallint, text) to authenticated;
grant execute on function public.is_space_member(uuid) to authenticated;
grant execute on function public.space_permissions(uuid) to authenticated;
grant execute on function public.channel_permissions(uuid) to authenticated;

-- ───────────────────────── Tempo real ─────────────────────────
-- O chat assina inserções em messages; o Realtime respeita as políticas acima.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
