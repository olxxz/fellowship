-- Mesa de verdade: cena (nome e imagem de fundo), sessões da campanha (cada mensagem fica marcada com a
-- sessão em que aconteceu, para buscar depois) e modelos de ficha próprios, escolhidos pelo mestre.

-- ───────────────────────── Modelos de ficha ─────────────────────────
-- Um modelo parte de um sistema (homebrew do grupo ou D&D 5e 2024) e muda o que a ficha tem
-- (atributos, perícias, seções). Pertence a quem criou; quem joga numa campanha que usa o modelo também lê.
create table public.sheet_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  base text not null check (base in ('homebrew', 'dnd2024')),
  config jsonb not null default '{}'::jsonb check (pg_column_size(config) < 65536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sheet_templates_owner_idx on public.sheet_templates (owner_id);

alter table public.campaigns
  add column template_id uuid references public.sheet_templates (id) on delete set null,
  add column scene_name text check (char_length(scene_name) <= 80),
  add column scene_url text;

alter table public.sheet_templates enable row level security;
create policy "modelos: dono, ou quem vê uma campanha que usa" on public.sheet_templates
  for select to authenticated using (
    owner_id = (select auth.uid())
    or exists (select 1 from public.campaigns c where c.template_id = sheet_templates.id)
  );
create policy "modelos: cria os próprios" on public.sheet_templates
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "modelos: dono edita" on public.sheet_templates
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "modelos: dono apaga" on public.sheet_templates
  for delete to authenticated using (owner_id = (select auth.uid()));
revoke all on public.sheet_templates from anon, authenticated;
grant select, delete on public.sheet_templates to authenticated;
grant insert (name, base, config) on public.sheet_templates to authenticated;
grant update (name, config, updated_at) on public.sheet_templates to authenticated;

-- O mestre escolhe a ficha da campanha (uma só por campanha): um sistema pronto ou um modelo dele.
create function public.set_campaign_template(p_campaign uuid, p_system text, p_template uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_base text;
  v_owner uuid;
begin
  if not private.is_campaign_master(p_campaign, v_user) then
    raise exception 'Só o mestre escolhe a ficha da campanha.' using errcode = '42501';
  end if;
  if p_template is null then
    if p_system not in ('homebrew', 'dnd2024') then
      raise exception 'Sistema inválido.' using errcode = '22023';
    end if;
    update public.campaigns set system = p_system, template_id = null where id = p_campaign;
    return;
  end if;
  select base, owner_id into v_base, v_owner from public.sheet_templates where id = p_template;
  if v_base is null or (v_owner <> v_user and not exists (select 1 from public.campaigns where id = p_campaign and template_id = p_template)) then
    raise exception 'Modelo não encontrado.' using errcode = '22023';
  end if;
  update public.campaigns set system = v_base, template_id = p_template where id = p_campaign;
end;
$$;

-- ───────────────────────── Cena ─────────────────────────
create function public.set_campaign_scene(p_campaign uuid, p_name text, p_url text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_campaign_master(p_campaign, (select auth.uid())) then
    raise exception 'Só o mestre muda a cena.' using errcode = '42501';
  end if;
  if char_length(coalesce(p_name, '')) > 80 then
    raise exception 'O nome da cena vai até 80 caracteres.' using errcode = '22023';
  end if;
  update public.campaigns set
    scene_name = nullif(btrim(coalesce(p_name, '')), ''),
    scene_url = nullif(btrim(coalesce(p_url, '')), '')
  where id = p_campaign;
end;
$$;

-- ───────────────────────── Sessões ─────────────────────────
create table public.campaign_sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  number integer not null,
  title text check (char_length(title) <= 80),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  unique (campaign_id, number)
);
-- No máximo uma sessão aberta por campanha.
create unique index campaign_sessions_open_idx on public.campaign_sessions (campaign_id) where ended_at is null;

alter table public.campaign_sessions enable row level security;
create policy "sessões: quem joga vê" on public.campaign_sessions
  for select to authenticated using (private.campaign_role(campaign_id, (select auth.uid())) is not null);
revoke all on public.campaign_sessions from anon, authenticated;
grant select on public.campaign_sessions to authenticated;

alter table public.messages add column session_id uuid references public.campaign_sessions (id) on delete set null;
create index messages_session_idx on public.messages (session_id) where session_id is not null;

-- Toda mensagem num canal da campanha com sessão aberta fica marcada com a sessão.
create function private.stamp_session() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select s.id into new.session_id
  from public.channels c
  join public.campaign_sessions s on s.campaign_id = c.campaign_id and s.ended_at is null
  where c.id = new.channel_id;
  return new;
end;
$$;
create trigger stamp_session before insert on public.messages for each row execute function private.stamp_session();

create function public.start_session(p_campaign uuid, p_title text default null) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_number integer;
begin
  if not private.is_campaign_master(p_campaign, (select auth.uid())) then
    raise exception 'Só o mestre abre a sessão.' using errcode = '42501';
  end if;
  if char_length(coalesce(p_title, '')) > 80 then
    raise exception 'O título da sessão vai até 80 caracteres.' using errcode = '22023';
  end if;
  update public.campaign_sessions set ended_at = now() where campaign_id = p_campaign and ended_at is null;
  select coalesce(max(number), 0) + 1 into v_number from public.campaign_sessions where campaign_id = p_campaign;
  insert into public.campaign_sessions (campaign_id, number, title) values (p_campaign, v_number, nullif(btrim(coalesce(p_title, '')), ''));
  return v_number;
end;
$$;

create function public.end_session(p_campaign uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_campaign_master(p_campaign, (select auth.uid())) then
    raise exception 'Só o mestre encerra a sessão.' using errcode = '42501';
  end if;
  update public.campaign_sessions set ended_at = now() where campaign_id = p_campaign and ended_at is null;
end;
$$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.campaigns, public.campaign_sessions;
  end if;
end;
$$;

revoke all on function private.stamp_session() from public, anon, authenticated;
revoke execute on function public.set_campaign_template(uuid, text, uuid), public.set_campaign_scene(uuid, text, text),
  public.start_session(uuid, text), public.end_session(uuid) from public, anon;
grant execute on function public.set_campaign_template(uuid, text, uuid), public.set_campaign_scene(uuid, text, text),
  public.start_session(uuid, text), public.end_session(uuid) to authenticated;
