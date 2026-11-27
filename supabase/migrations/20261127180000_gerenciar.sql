-- Gerenciar o Cenário: canais e categorias (editar, reordenar, apagar, permissões por canal), cargos
-- (criar, editar, ordem, permissões), membros (cargos, expulsar) e sair do Cenário.
-- Nova permissão 2048 = expulsar membros (todas = 4095). Ver packages/core/src/permissions.ts.

create or replace function private.space_permissions(p_space uuid, p_user uuid) returns integer
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
    return 4095;
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

create or replace function private.channel_permissions(p_channel uuid, p_user uuid) returns integer
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
    return 4095;
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

update public.roles set permissions = 4095 where permissions = 2047;

-- Cenários novos: o Administrador já vem com todas as permissões, incluindo expulsar.
create or replace function public.create_space(
  p_name text,
  p_description text default null,
  p_color text default '#d4a24c',
  p_template text default 'padrao'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_name text := btrim(coalesce(p_name, ''));
  v_color text := lower(btrim(coalesce(p_color, '')));
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
  if v_color !~ '^#[0-9a-f]{6}$' then
    raise exception 'Cor inválida: use o formato #rrggbb.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = v_user) then
    raise exception 'Perfil não encontrado.' using errcode = '22023';
  end if;

  select upper(string_agg(left(w, 1), '' order by n)) into v_short
  from (
    select w, n from regexp_split_to_table(v_name, '\s+') with ordinality as t (w, n)
    where w <> '' and lower(w) not in ('de', 'da', 'do', 'das', 'dos', 'e', 'o', 'a', 'os', 'as', 'the', 'of')
    order by n
    limit 2
  ) words;
  v_short := coalesce(nullif(v_short, ''), upper(left(v_name, 2)));

  insert into public.spaces (name, short, description, color, owner_id)
  values (v_name, v_short, nullif(btrim(coalesce(p_description, '')), ''), v_color, v_user)
  returning id into v_space;

  insert into public.space_members (space_id, user_id) values (v_space, v_user);

  insert into public.roles (space_id, name, color, position, permissions, is_default) values
    (v_space, 'Administrador', 3, 4, 4095, false),
    (v_space, 'Narrador', 4, 3, 1 | 2 | 4 | 8 | 32 | 64 | 128, false),
    (v_space, 'Visitante', null, 0, 1, true);
  insert into public.roles (space_id, name, color, position, permissions, granted_on_join)
  values (v_space, 'Membro', 1, 1, 1 | 2 | 4 | 32, true)
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

-- Posição do cargo mais alto da pessoa (dono: acima de tudo). Só se mexe em cargos abaixo dele.
create function private.top_role_position(p_space uuid, p_user uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select case
    when (select owner_id from public.spaces where id = p_space) = p_user then 2147483647
    else coalesce((
      select max(r.position) from public.roles r
      join public.member_roles mr on mr.role_id = r.id and mr.user_id = p_user
      where r.space_id = p_space
    ), -1)
  end
$$;

create function private.require(p_space uuid, p_bit integer, p_message text) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null or private.space_permissions(p_space, v_user) & p_bit = 0 then
    raise exception '%', p_message using errcode = '42501';
  end if;
  return v_user;
end;
$$;

-- ───────────────────────── Canais e categorias ─────────────────────────

create function public.update_channel(p_channel uuid, p_name text, p_topic text, p_category uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_space uuid;
  v_name text := btrim(coalesce(p_name, ''));
begin
  select space_id into v_space from public.channels where id = p_channel;
  perform private.require(v_space, 256, 'Você não pode gerenciar canais neste Cenário.');
  if char_length(v_name) not between 1 and 40 then
    raise exception 'O nome do canal vai de 1 a 40 caracteres.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_topic, '')) > 200 then
    raise exception 'A descrição vai até 200 caracteres.' using errcode = '22023';
  end if;
  if p_category is not null and not exists (select 1 from public.categories where id = p_category and space_id = v_space) then
    raise exception 'Categoria não encontrada neste Cenário.' using errcode = '22023';
  end if;
  update public.channels set name = v_name, topic = nullif(btrim(coalesce(p_topic, '')), ''), category_id = p_category where id = p_channel;
end;
$$;

create function public.delete_channel(p_channel uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_space uuid;
begin
  select space_id into v_space from public.channels where id = p_channel;
  perform private.require(v_space, 256, 'Você não pode gerenciar canais neste Cenário.');
  delete from public.channels where id = p_channel;
end;
$$;

create function public.update_category(p_category uuid, p_name text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_space uuid;
begin
  select space_id into v_space from public.categories where id = p_category;
  perform private.require(v_space, 256, 'Você não pode gerenciar canais neste Cenário.');
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 40 then
    raise exception 'O nome da categoria vai de 1 a 40 caracteres.' using errcode = '22023';
  end if;
  update public.categories set name = btrim(p_name) where id = p_category;
end;
$$;

-- Apagar a categoria não apaga os canais: eles ficam sem categoria.
create function public.delete_category(p_category uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_space uuid;
begin
  select space_id into v_space from public.categories where id = p_category;
  perform private.require(v_space, 256, 'Você não pode gerenciar canais neste Cenário.');
  delete from public.categories where id = p_category;
end;
$$;

-- Ordem dos canais de uma categoria (ou dos sem categoria): a lista de ids, de cima para baixo.
create function public.reorder_channels(p_space uuid, p_category uuid, p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require(p_space, 256, 'Você não pode gerenciar canais neste Cenário.');
  update public.channels c set position = o.ord - 1, category_id = p_category
  from unnest(p_ids) with ordinality as o(id, ord)
  where c.id = o.id and c.space_id = p_space;
end;
$$;

create function public.reorder_categories(p_space uuid, p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require(p_space, 256, 'Você não pode gerenciar canais neste Cenário.');
  update public.categories c set position = o.ord - 1
  from unnest(p_ids) with ordinality as o(id, ord)
  where c.id = o.id and c.space_id = p_space;
end;
$$;

-- Ajuste de permissão de um cargo num canal (libera/nega). Zero nos dois apaga o ajuste.
create function public.set_channel_override(p_channel uuid, p_role uuid, p_allow integer, p_deny integer) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_space uuid;
begin
  select space_id into v_space from public.channels where id = p_channel;
  perform private.require(v_space, 256, 'Você não pode gerenciar canais neste Cenário.');
  if not exists (select 1 from public.roles where id = p_role and space_id = v_space) then
    raise exception 'Cargo não encontrado neste Cenário.' using errcode = '22023';
  end if;
  delete from public.permission_overrides where channel_id = p_channel and role_id = p_role;
  if coalesce(p_allow, 0) <> 0 or coalesce(p_deny, 0) <> 0 then
    insert into public.permission_overrides (space_id, channel_id, role_id, allow, deny)
    values (v_space, p_channel, p_role, coalesce(p_allow, 0) & 4095, coalesce(p_deny, 0) & 4095);
  end if;
end;
$$;

-- Quem gerencia canais lê os ajustes (a política de leitura já existe); devolve os do canal.
create function public.channel_overrides(p_channel uuid)
returns table (role_id uuid, allow integer, deny integer)
language sql stable security invoker set search_path = '' as $$
  select o.role_id, o.allow, o.deny from public.permission_overrides o where o.channel_id = p_channel and o.role_id is not null
$$;

-- ───────────────────────── Cargos ─────────────────────────

create function private.check_role_change(p_space uuid, p_user uuid, p_position integer, p_permissions integer) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_position >= private.top_role_position(p_space, p_user) then
    raise exception 'Só dá para mexer em cargos abaixo do seu cargo mais alto.' using errcode = '42501';
  end if;
  if p_permissions & ~private.space_permissions(p_space, p_user) <> 0 then
    raise exception 'Você não pode dar permissões que não tem.' using errcode = '42501';
  end if;
end;
$$;

create function public.create_role(p_space uuid, p_name text, p_color smallint, p_permissions integer) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := private.require(p_space, 512, 'Você não pode gerenciar cargos neste Cenário.');
  v_id uuid;
begin
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 40 then
    raise exception 'O nome do cargo vai de 1 a 40 caracteres.' using errcode = '22023';
  end if;
  -- Entra logo acima do cargo padrão (abaixo de todos os outros, que sobem uma posição).
  update public.roles set position = position + 1 where space_id = p_space and not is_default;
  perform private.check_role_change(p_space, v_user, 1, coalesce(p_permissions, 0));
  insert into public.roles (space_id, name, color, position, permissions)
  values (p_space, btrim(p_name), p_color, 1, coalesce(p_permissions, 0) & 4095)
  returning id into v_id;
  return v_id;
end;
$$;

create function public.update_role(p_role uuid, p_name text, p_color smallint, p_permissions integer, p_granted_on_join boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_role public.roles;
  v_user uuid;
begin
  select * into v_role from public.roles where id = p_role;
  v_user := private.require(v_role.space_id, 512, 'Você não pode gerenciar cargos neste Cenário.');
  perform private.check_role_change(v_role.space_id, v_user, case when v_role.is_default then -1 else v_role.position end, coalesce(p_permissions, 0));
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 40 then
    raise exception 'O nome do cargo vai de 1 a 40 caracteres.' using errcode = '22023';
  end if;
  update public.roles
  set name = btrim(p_name), color = p_color, permissions = coalesce(p_permissions, 0) & 4095,
      granted_on_join = case when v_role.is_default then false else coalesce(p_granted_on_join, false) end
  where id = p_role;
end;
$$;

create function public.delete_role(p_role uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_role public.roles;
  v_user uuid;
begin
  select * into v_role from public.roles where id = p_role;
  v_user := private.require(v_role.space_id, 512, 'Você não pode gerenciar cargos neste Cenário.');
  if v_role.is_default then
    raise exception 'O cargo de todos os membros não pode ser apagado.' using errcode = '22023';
  end if;
  perform private.check_role_change(v_role.space_id, v_user, v_role.position, 0);
  delete from public.roles where id = p_role;
end;
$$;

-- Ordem dos cargos (de cima para baixo). Só os que estão abaixo do seu cargo mais alto mudam de lugar.
create function public.reorder_roles(p_space uuid, p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := private.require(p_space, 512, 'Você não pode gerenciar cargos neste Cenário.');
  v_top integer := private.top_role_position(p_space, v_user);
  v_count integer := array_length(p_ids, 1);
begin
  if exists (
    select 1 from public.roles r where r.space_id = p_space and not r.is_default and r.position >= v_top and r.id = any (p_ids)
  ) then
    raise exception 'Só dá para mexer em cargos abaixo do seu cargo mais alto.' using errcode = '42501';
  end if;
  update public.roles r set position = v_count - o.ord + 1
  from unnest(p_ids) with ordinality as o(id, ord)
  where r.id = o.id and r.space_id = p_space and not r.is_default;
end;
$$;

-- ───────────────────────── Membros ─────────────────────────

-- Define os cargos de alguém. Cargos acima (ou iguais) ao seu mais alto não mudam, nem para tirar nem para dar.
create function public.set_member_roles(p_space uuid, p_user uuid, p_role_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := private.require(p_space, 512, 'Você não pode gerenciar cargos neste Cenário.');
  v_top integer := private.top_role_position(p_space, v_actor);
begin
  if not private.is_space_member(p_space, p_user) then
    raise exception 'Essa pessoa não está no Cenário.' using errcode = '22023';
  end if;
  if p_user = (select owner_id from public.spaces where id = p_space) and v_actor <> p_user then
    raise exception 'Os cargos do dono não mudam.' using errcode = '42501';
  end if;
  delete from public.member_roles mr using public.roles r
  where mr.role_id = r.id and mr.space_id = p_space and mr.user_id = p_user and r.position < v_top and not (r.id = any (p_role_ids));
  insert into public.member_roles (space_id, user_id, role_id)
  select p_space, p_user, r.id from public.roles r
  where r.space_id = p_space and not r.is_default and r.position < v_top and r.id = any (p_role_ids)
  on conflict do nothing;
end;
$$;

create function public.kick_member(p_space uuid, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := private.require(p_space, 2048, 'Você não pode expulsar membros deste Cenário.');
begin
  if p_user = (select owner_id from public.spaces where id = p_space) then
    raise exception 'O dono não pode ser expulso.' using errcode = '42501';
  end if;
  if p_user = v_actor then
    raise exception 'Para sair, use Sair do Cenário.' using errcode = '22023';
  end if;
  if private.top_role_position(p_space, p_user) >= private.top_role_position(p_space, v_actor) then
    raise exception 'Só dá para expulsar quem tem cargo abaixo do seu.' using errcode = '42501';
  end if;
  delete from public.space_members where space_id = p_space and user_id = p_user;
end;
$$;

create function public.leave_space(p_space uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user = (select owner_id from public.spaces where id = p_space) then
    raise exception 'O dono não sai do próprio Cenário. Para encerrar, apague o Cenário.' using errcode = '22023';
  end if;
  delete from public.space_members where space_id = p_space and user_id = v_user;
end;
$$;

revoke all on function private.top_role_position(uuid, uuid), private.require(uuid, integer, text),
  private.check_role_change(uuid, uuid, integer, integer) from public, anon, authenticated;
revoke execute on function public.update_channel(uuid, text, text, uuid), public.delete_channel(uuid), public.update_category(uuid, text),
  public.delete_category(uuid), public.reorder_channels(uuid, uuid, uuid[]), public.reorder_categories(uuid, uuid[]),
  public.set_channel_override(uuid, uuid, integer, integer), public.channel_overrides(uuid),
  public.create_role(uuid, text, smallint, integer), public.update_role(uuid, text, smallint, integer, boolean), public.delete_role(uuid),
  public.reorder_roles(uuid, uuid[]), public.set_member_roles(uuid, uuid, uuid[]), public.kick_member(uuid, uuid), public.leave_space(uuid)
  from public, anon;
grant execute on function public.update_channel(uuid, text, text, uuid), public.delete_channel(uuid), public.update_category(uuid, text),
  public.delete_category(uuid), public.reorder_channels(uuid, uuid, uuid[]), public.reorder_categories(uuid, uuid[]),
  public.set_channel_override(uuid, uuid, integer, integer), public.channel_overrides(uuid),
  public.create_role(uuid, text, smallint, integer), public.update_role(uuid, text, smallint, integer, boolean), public.delete_role(uuid),
  public.reorder_roles(uuid, uuid[]), public.set_member_roles(uuid, uuid, uuid[]), public.kick_member(uuid, uuid), public.leave_space(uuid)
  to authenticated;
