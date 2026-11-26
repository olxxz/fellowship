-- Fellowship · cores livres para Cenários e perfis, convites por link e cargo de entrada.
-- A migração anterior já foi aplicada em produção: aqui só alterações, nunca edição da anterior.

-- ───────────────────────── Cores livres (hex) ─────────────────────────
-- As cores 1–6 viram o hex do tema escuro de cada player-* (o mesmo valor nos dois temas daqui em diante).

alter table public.spaces drop constraint if exists spaces_color_check;
alter table public.spaces alter column color drop default;
alter table public.spaces alter column color type text using (
  case color when 1 then '#4fb3a9' when 2 then '#e07a5f' when 3 then '#a99cf5'
             when 4 then '#d4a24c' when 5 then '#5b8def' when 6 then '#7ee0a1' else '#d4a24c' end
);
alter table public.spaces alter column color set default '#d4a24c';
alter table public.spaces add constraint spaces_color_hex check (color ~ '^#[0-9a-f]{6}$');

alter table public.profiles drop constraint if exists profiles_color_check;
alter table public.profiles alter column color drop default;
alter table public.profiles alter column color type text using (
  case color when 1 then '#4fb3a9' when 2 then '#e07a5f' when 3 then '#a99cf5'
             when 4 then '#d4a24c' when 5 then '#5b8def' when 6 then '#7ee0a1' else '#4fb3a9' end
);
alter table public.profiles alter column color set default '#4fb3a9';
alter table public.profiles add constraint profiles_color_hex check (color ~ '^#[0-9a-f]{6}$');

-- Perfil novo ganha uma das cores predefinidas, sorteada.
create or replace function private.handle_new_user() returns trigger
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
    (array['#4fb3a9', '#e07a5f', '#a99cf5', '#d4a24c', '#5b8def', '#7ee0a1'])[1 + floor(random() * 6)::int]
  );
  return new;
end;
$$;

-- ───────────────────────── Cargo de entrada ─────────────────────────
-- Quem entra por convite recebe os cargos marcados aqui (no modelo padrão, Membro).
alter table public.roles add column granted_on_join boolean not null default false;
update public.roles set granted_on_join = true where name = 'Membro' and not is_default;

-- ───────────────────────── Criar Cenário (cor em hex) ─────────────────────────
drop function public.create_space(text, text, smallint, text);

create function public.create_space(
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
    (v_space, 'Administrador', 3, 4, 2047, false),
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

revoke execute on function public.create_space(text, text, text, text) from public, anon;
grant execute on function public.create_space(text, text, text, text) to authenticated;

-- ───────────────────────── Editar o Cenário ─────────────────────────
-- Quem gerencia tema (dono e Administrador) edita nome, iniciais, descrição e cor.
drop policy "cenário: dono edita" on public.spaces;
create policy "cenário: quem gerencia tema edita" on public.spaces
  for update to authenticated
  using (private.space_permissions(id, (select auth.uid())) & 1024 <> 0)
  with check (private.space_permissions(id, (select auth.uid())) & 1024 <> 0);

-- ───────────────────────── Convites ─────────────────────────

create table public.invites (
  code text primary key check (code ~ '^[a-z0-9]{8,16}$'),
  space_id uuid not null references public.spaces (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  max_uses integer check (max_uses is null or max_uses between 1 and 1000),
  uses integer not null default 0,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index invites_space_idx on public.invites (space_id);
alter table public.invites enable row level security;

-- Cada um vê os convites que criou; quem gerencia canais vê todos do Cenário.
create policy "convites: quem criou ou gerencia" on public.invites
  for select to authenticated
  using (created_by = (select auth.uid()) or private.space_permissions(space_id, (select auth.uid())) & 256 <> 0);

revoke all on public.invites from anon, authenticated;
grant select on public.invites to authenticated;

create function private.invite_status(p_invite public.invites) returns text
language sql stable set search_path = '' as $$
  select case
    when p_invite.revoked_at is not null then 'revogado'
    when p_invite.expires_at is not null and p_invite.expires_at <= now() then 'expirado'
    when p_invite.max_uses is not null and p_invite.uses >= p_invite.max_uses then 'esgotado'
    else 'valido'
  end;
$$;

-- Gera um convite. Validade em horas (vazio = não expira) e limite de usos (vazio = sem limite).
create function public.create_invite(p_space uuid, p_expires_hours integer default 168, p_max_uses integer default null)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_code text;
begin
  if v_user is null or private.space_permissions(p_space, v_user) & 32 = 0 then
    raise exception 'Você não pode criar convites neste Cenário.' using errcode = '42501';
  end if;
  if p_expires_hours is not null and (p_expires_hours < 1 or p_expires_hours > 720) then
    raise exception 'A validade do convite vai de 1 hora a 30 dias.' using errcode = '22023';
  end if;
  if p_max_uses is not null and (p_max_uses < 1 or p_max_uses > 1000) then
    raise exception 'O limite de usos vai de 1 a 1000.' using errcode = '22023';
  end if;
  loop
    v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    exit when not exists (select 1 from public.invites where code = v_code);
  end loop;
  insert into public.invites (code, space_id, created_by, max_uses, expires_at)
  values (v_code, p_space, v_user, p_max_uses, case when p_expires_hours is null then null else now() + make_interval(hours => p_expires_hours) end);
  return v_code;
end;
$$;

create function public.revoke_invite(p_code text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_invite public.invites;
begin
  select * into v_invite from public.invites where code = lower(p_code);
  if v_invite.code is null or v_user is null
     or (v_invite.created_by <> v_user and private.space_permissions(v_invite.space_id, v_user) & 256 = 0) then
    raise exception 'Convite não encontrado.' using errcode = '42501';
  end if;
  update public.invites set revoked_at = now() where code = v_invite.code and revoked_at is null;
end;
$$;

-- Prévia do convite (também antes do login): nome, cor e quantos membros. Nada além disso.
create function public.get_invite(p_code text)
returns table (space_id uuid, name text, short text, description text, color text, member_count integer, inviter text, status text, already_member boolean)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, s.short, s.description, s.color,
         (select count(*)::int from public.space_members m where m.space_id = s.id),
         p.display_name,
         private.invite_status(i),
         coalesce(private.is_space_member(s.id, (select auth.uid())), false)
  from public.invites i
  join public.spaces s on s.id = i.space_id
  join public.profiles p on p.id = i.created_by
  where i.code = lower(btrim(coalesce(p_code, '')));
$$;

-- Aceita o convite: entra no Cenário com os cargos de entrada. Quem já é membro só é levado ao Cenário.
create function public.accept_invite(p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_invite public.invites;
  v_status text;
begin
  if v_user is null then
    raise exception 'Entre na sua conta para aceitar o convite.' using errcode = '28000';
  end if;
  select * into v_invite from public.invites where code = lower(btrim(coalesce(p_code, ''))) for update;
  if v_invite.code is null then
    raise exception 'Convite não encontrado.' using errcode = '22023';
  end if;
  if private.is_space_member(v_invite.space_id, v_user) then
    return v_invite.space_id;
  end if;
  v_status := private.invite_status(v_invite);
  if v_status <> 'valido' then
    raise exception 'Este convite está %.', v_status using errcode = '22023';
  end if;
  insert into public.space_members (space_id, user_id) values (v_invite.space_id, v_user);
  insert into public.member_roles (space_id, user_id, role_id)
  select v_invite.space_id, v_user, r.id from public.roles r where r.space_id = v_invite.space_id and r.granted_on_join;
  update public.invites set uses = uses + 1 where code = v_invite.code;
  return v_invite.space_id;
end;
$$;

revoke all on function private.invite_status(public.invites) from public, anon, authenticated;
revoke execute on function public.create_invite(uuid, integer, integer) from public, anon;
revoke execute on function public.revoke_invite(text) from public, anon;
revoke execute on function public.accept_invite(text) from public, anon;
revoke execute on function public.get_invite(text) from public;
grant execute on function public.create_invite(uuid, integer, integer) to authenticated;
grant execute on function public.revoke_invite(text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.get_invite(text) to anon, authenticated;
