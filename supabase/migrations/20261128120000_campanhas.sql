-- Fase 1: campanhas (mestre, jogadores, espectadores), canais da campanha, personagens com ficha
-- e rolagens (gravadas pelo servidor; podem ser ocultas, só o autor e o mestre veem).

-- ───────────────────────── Campanhas ─────────────────────────
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  description text check (char_length(description) <= 500),
  color text not null default '#d4a24c' check (color ~ '^#[0-9a-f]{6}$'),
  banner_url text,
  system text not null default 'homebrew' check (system in ('homebrew', 'dnd2024')),
  -- Aberta: qualquer membro do Cenário entra como jogador sem convite do mestre.
  open_to_join boolean not null default false,
  position integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index campaigns_space_idx on public.campaigns (space_id);

create table public.campaign_members (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('mestre', 'jogador', 'espectador')),
  joined_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);
create index campaign_members_user_idx on public.campaign_members (user_id);

alter table public.channels add column campaign_id uuid references public.campaigns (id) on delete cascade;
create index channels_campaign_idx on public.channels (campaign_id);

-- Papel na campanha; o dono do Cenário vale como mestre em todas.
create function private.campaign_role(p_campaign uuid, p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select 'mestre' from public.campaigns c join public.spaces s on s.id = c.space_id where c.id = p_campaign and s.owner_id = p_user),
    (select role from public.campaign_members where campaign_id = p_campaign and user_id = p_user)
  )
$$;

create function private.is_campaign_master(p_campaign uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.campaign_role(p_campaign, p_user) = 'mestre'
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
  v_campaign uuid;
  v_role text;
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

  -- Canais de campanha: só membros da campanha; o mestre manda (ver, escrever, falar, anunciar, gerenciar);
  -- espectador só vê e ouve.
  select c.campaign_id into v_campaign from public.channels c where c.id = p_channel;
  if v_campaign is not null then
    v_role := private.campaign_role(v_campaign, p_user);
    if v_role is null then
      return 0;
    elsif v_role = 'mestre' then
      v_perms := v_perms | 31;
    elsif v_role = 'espectador' then
      v_perms := v_perms & ~(2 | 4 | 8);
    end if;
  end if;

  if v_perms & 1 = 0 then
    return 0;
  end if;
  return v_perms;
end;
$$;

-- Saiu do Cenário: sai das campanhas dele.
create function private.leave_campaigns() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.campaign_members cm using public.campaigns c
  where cm.campaign_id = c.id and c.space_id = old.space_id and cm.user_id = old.user_id;
  return old;
end;
$$;
create trigger on_space_member_removed after delete on public.space_members
  for each row execute function private.leave_campaigns();

alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
create policy "campanhas: membros do Cenário veem" on public.campaigns
  for select to authenticated using (private.is_space_member(space_id, (select auth.uid())));
create policy "membros da campanha: membros do Cenário veem" on public.campaign_members
  for select to authenticated using (exists (
    select 1 from public.campaigns c where c.id = campaign_id and private.is_space_member(c.space_id, (select auth.uid()))
  ));
revoke all on public.campaigns, public.campaign_members from anon, authenticated;
grant select on public.campaigns, public.campaign_members to authenticated;

-- Criar campanha (Criar campanhas = 64): quem cria vira mestre; já nascem a mesa (texto) e a voz da mesa.
create function public.create_campaign(p_space uuid, p_name text, p_description text default null, p_color text default '#d4a24c', p_system text default 'homebrew')
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_id uuid;
begin
  if v_user is null or private.space_permissions(p_space, v_user) & 64 = 0 then
    raise exception 'Você não pode criar campanhas neste Cenário.' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 60 then
    raise exception 'O nome da campanha vai de 1 a 60 caracteres.' using errcode = '22023';
  end if;
  if lower(coalesce(p_color, '')) !~ '^#[0-9a-f]{6}$' then
    raise exception 'Cor inválida.' using errcode = '22023';
  end if;
  if p_system not in ('homebrew', 'dnd2024') then
    raise exception 'Sistema inválido.' using errcode = '22023';
  end if;
  insert into public.campaigns (space_id, name, description, color, system, created_by, position)
  values (p_space, btrim(p_name), nullif(btrim(coalesce(p_description, '')), ''), lower(p_color), p_system, v_user,
    coalesce((select max(position) + 1 from public.campaigns where space_id = p_space), 0))
  returning id into v_id;
  insert into public.campaign_members (campaign_id, user_id, role) values (v_id, v_user, 'mestre');
  insert into public.channels (space_id, campaign_id, kind, name, topic, position) values
    (p_space, v_id, 'texto', 'mesa', 'Jogo, rolagens e cena atual.', 0),
    (p_space, v_id, 'texto', 'fora-de-jogo', 'Conversa fora do personagem.', 1),
    (p_space, v_id, 'voz', 'Voz da mesa', null, 2);
  return v_id;
end;
$$;

create function public.update_campaign(p_campaign uuid, p_name text, p_description text, p_color text, p_system text, p_open boolean, p_banner_url text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_campaign_master(p_campaign, (select auth.uid())) then
    raise exception 'Só o mestre muda a campanha.' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 60 then
    raise exception 'O nome da campanha vai de 1 a 60 caracteres.' using errcode = '22023';
  end if;
  update public.campaigns set
    name = btrim(p_name),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    color = case when lower(coalesce(p_color, '')) ~ '^#[0-9a-f]{6}$' then lower(p_color) else color end,
    system = case when p_system in ('homebrew', 'dnd2024') then p_system else system end,
    open_to_join = coalesce(p_open, open_to_join),
    banner_url = nullif(btrim(coalesce(p_banner_url, '')), '')
  where id = p_campaign;
end;
$$;

create function public.delete_campaign(p_campaign uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_campaign_master(p_campaign, (select auth.uid())) then
    raise exception 'Só o mestre apaga a campanha.' using errcode = '42501';
  end if;
  delete from public.campaigns where id = p_campaign;
end;
$$;

-- Mestre põe alguém do Cenário na campanha (ou muda o papel, ou tira com p_role nulo).
create function public.set_campaign_member(p_campaign uuid, p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_space uuid;
begin
  select space_id into v_space from public.campaigns where id = p_campaign;
  if not private.is_campaign_master(p_campaign, (select auth.uid())) then
    raise exception 'Só o mestre gerencia quem joga.' using errcode = '42501';
  end if;
  if p_role is null then
    delete from public.campaign_members where campaign_id = p_campaign and user_id = p_user;
    return;
  end if;
  if p_role not in ('mestre', 'jogador', 'espectador') then
    raise exception 'Papel inválido.' using errcode = '22023';
  end if;
  if not private.is_space_member(v_space, p_user) then
    raise exception 'Essa pessoa não está no Cenário.' using errcode = '22023';
  end if;
  insert into public.campaign_members (campaign_id, user_id, role) values (p_campaign, p_user, p_role)
  on conflict (campaign_id, user_id) do update set role = excluded.role;
end;
$$;

-- Campanha aberta: membro do Cenário entra como jogador (ou espectador). Sair: qualquer um (menos o último mestre).
create function public.join_campaign(p_campaign uuid, p_role text default 'jogador') returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_campaign public.campaigns;
begin
  select * into v_campaign from public.campaigns where id = p_campaign;
  if v_campaign.id is null or not private.is_space_member(v_campaign.space_id, v_user) then
    raise exception 'Campanha não encontrada.' using errcode = '22023';
  end if;
  if not v_campaign.open_to_join and p_role <> 'espectador' then
    raise exception 'Esta campanha é fechada: peça ao mestre para entrar.' using errcode = '42501';
  end if;
  if p_role not in ('jogador', 'espectador') then
    raise exception 'Papel inválido.' using errcode = '22023';
  end if;
  insert into public.campaign_members (campaign_id, user_id, role) values (p_campaign, v_user, p_role)
  on conflict (campaign_id, user_id) do nothing;
end;
$$;

create function public.leave_campaign(p_campaign uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
begin
  if (select role from public.campaign_members where campaign_id = p_campaign and user_id = v_user) = 'mestre'
     and (select count(*) from public.campaign_members where campaign_id = p_campaign and role = 'mestre') = 1 then
    raise exception 'Você é o único mestre: passe o papel para alguém antes de sair.' using errcode = '22023';
  end if;
  delete from public.campaign_members where campaign_id = p_campaign and user_id = v_user;
end;
$$;

-- ───────────────────────── Personagens ─────────────────────────
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  -- Dono do personagem; nulo = NPC do mestre.
  owner_id uuid references public.profiles (id) on delete set null,
  kind text not null default 'pc' check (kind in ('pc', 'npc')),
  name text not null check (char_length(name) between 1 and 80),
  portrait_url text,
  color text not null default '#4fb3a9' check (color ~ '^#[0-9a-f]{6}$'),
  template text not null default 'homebrew' check (template in ('homebrew', 'dnd2024')),
  sheet jsonb not null default '{}'::jsonb check (jsonb_typeof(sheet) = 'object' and pg_column_size(sheet) < 262144),
  -- NPC escondido dos jogadores até o mestre revelar.
  revealed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index characters_campaign_idx on public.characters (campaign_id);

alter table public.characters enable row level security;
create policy "personagens: quem joga vê (NPC escondido só o mestre)" on public.characters
  for select to authenticated using (
    private.campaign_role(campaign_id, (select auth.uid())) is not null
    and (kind = 'pc' or revealed or private.is_campaign_master(campaign_id, (select auth.uid())))
  );
create policy "personagens: jogador cria o próprio, mestre cria qualquer" on public.characters
  for insert to authenticated with check (
    private.is_campaign_master(campaign_id, (select auth.uid()))
    or (owner_id = (select auth.uid()) and kind = 'pc' and private.campaign_role(campaign_id, (select auth.uid())) = 'jogador')
  );
create policy "personagens: dono ou mestre editam" on public.characters
  for update to authenticated
  using (owner_id = (select auth.uid()) or private.is_campaign_master(campaign_id, (select auth.uid())))
  with check (owner_id = (select auth.uid()) or private.is_campaign_master(campaign_id, (select auth.uid())));
create policy "personagens: dono ou mestre apagam" on public.characters
  for delete to authenticated using (owner_id = (select auth.uid()) or private.is_campaign_master(campaign_id, (select auth.uid())));
revoke all on public.characters from anon, authenticated;
grant select, delete on public.characters to authenticated;
grant insert (campaign_id, owner_id, kind, name, portrait_url, color, template, sheet, revealed) on public.characters to authenticated;
grant update (owner_id, kind, name, portrait_url, color, template, sheet, revealed, updated_at) on public.characters to authenticated;

-- Só o mestre troca dono, tipo ou revelação.
create function private.guard_character() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if (new.owner_id is distinct from old.owner_id or new.kind <> old.kind or new.revealed <> old.revealed or new.campaign_id <> old.campaign_id)
     and not private.is_campaign_master(old.campaign_id, (select auth.uid())) then
    raise exception 'Só o mestre muda dono, tipo ou revelação do personagem.' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger guard_character before update on public.characters for each row execute function private.guard_character();

alter table public.characters replica identity full;

-- ───────────────────────── Rolagens ─────────────────────────
-- Mensagens de rolagem (kind 'rolagem') só são gravadas pelo servidor, que sorteia. Ocultas: só autor e mestre veem.
alter table public.messages add column visibility text not null default 'todos' check (visibility in ('todos', 'mestre'));

-- Quem é "mestre" de um canal: nas campanhas, o mestre; fora delas, quem gerencia mensagens.
create function private.is_channel_master(p_channel uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when (select campaign_id from public.channels where id = p_channel) is not null
      then private.is_campaign_master((select campaign_id from public.channels where id = p_channel), p_user)
    else private.channel_permissions(p_channel, p_user) & 16 <> 0
  end
$$;

drop policy "mensagens: quem pode ver o canal" on public.messages;
create policy "mensagens: quem pode ver o canal" on public.messages
  for select to authenticated using (
    private.channel_permissions(channel_id, (select auth.uid())) & 1 <> 0
    and (visibility = 'todos' or author_id = (select auth.uid()) or private.is_channel_master(channel_id, (select auth.uid())))
  );
drop policy "mensagens: postar como si mesmo onde pode" on public.messages;
create policy "mensagens: postar como si mesmo onde pode" on public.messages
  for insert to authenticated
  with check (author_id = (select auth.uid()) and kind in ('texto', 'figurinha') and visibility = 'todos' and private.can_post(channel_id, (select auth.uid())));

-- ───────────────────────── Imagens dos personagens ─────────────────────────
-- cenarios/<space>/personagens/<user>/…: cada membro sobe as próprias imagens de personagem.
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'storage') then
    return;
  end if;
  execute $p$create policy "cenarios: membros sobem retratos" on storage.objects for insert to authenticated
    with check (bucket_id = 'cenarios' and (storage.foldername(name))[2] = 'personagens'
      and (storage.foldername(name))[3] = (select auth.uid())::text
      and private.is_space_member(((storage.foldername(name))[1])::uuid, (select auth.uid())))$p$;
end;
$$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.characters;
  end if;
end;
$$;

revoke all on function private.campaign_role(uuid, uuid), private.is_campaign_master(uuid, uuid), private.is_channel_master(uuid, uuid) from public, anon;
grant execute on function private.campaign_role(uuid, uuid), private.is_campaign_master(uuid, uuid), private.is_channel_master(uuid, uuid) to authenticated;
revoke execute on function public.create_campaign(uuid, text, text, text, text), public.update_campaign(uuid, text, text, text, text, boolean, text),
  public.delete_campaign(uuid), public.set_campaign_member(uuid, uuid, text), public.join_campaign(uuid, text), public.leave_campaign(uuid) from public, anon;
grant execute on function public.create_campaign(uuid, text, text, text, text), public.update_campaign(uuid, text, text, text, text, boolean, text),
  public.delete_campaign(uuid), public.set_campaign_member(uuid, uuid, text), public.join_campaign(uuid, text), public.leave_campaign(uuid) to authenticated;
