-- Chat completo: responder, editar, menções, reações, figurinhas e não lidas (canais e conversas diretas).

-- ───────────────────────── Mensagens de canal ─────────────────────────
alter table public.messages
  add column reply_to uuid references public.messages (id) on delete set null,
  add column mentions uuid[] not null default '{}';
alter table public.messages drop constraint messages_kind_check;
alter table public.messages add constraint messages_kind_check check (kind in ('texto', 'rolagem', 'sistema', 'figurinha'));

drop policy "mensagens: postar como si mesmo onde pode" on public.messages;
create policy "mensagens: postar como si mesmo onde pode" on public.messages
  for insert to authenticated
  with check (author_id = (select auth.uid()) and kind in ('texto', 'figurinha') and private.can_post(channel_id, (select auth.uid())));
create policy "mensagens: o autor edita" on public.messages
  for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));

grant insert (kind, reply_to, mentions) on public.messages to authenticated;
grant update (content, edited_at, mentions) on public.messages to authenticated;

-- ───────────────────────── Conversas diretas ─────────────────────────
alter table public.direct_messages
  add column kind text not null default 'texto' check (kind in ('texto', 'figurinha')),
  add column reply_to uuid references public.direct_messages (id) on delete set null,
  add column edited_at timestamptz;
create policy "conversa: o autor edita" on public.direct_messages
  for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
grant insert (kind, reply_to) on public.direct_messages to authenticated;
grant update (content, edited_at) on public.direct_messages to authenticated;

-- ───────────────────────── Reações ─────────────────────────
create table public.message_reactions (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 64),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);
create table public.direct_reactions (
  message_id uuid not null references public.direct_messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 64),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create function private.can_see_message(p_message uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.messages m where m.id = p_message and private.channel_permissions(m.channel_id, p_user) & 1 <> 0)
$$;
create function private.can_see_direct(p_message uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.direct_messages m where m.id = p_message and p_user in (m.user_a, m.user_b))
$$;

alter table public.message_reactions enable row level security;
alter table public.direct_reactions enable row level security;
create policy "reações: quem vê a mensagem" on public.message_reactions
  for select to authenticated using (private.can_see_message(message_id, (select auth.uid())));
create policy "reações: reagir como si mesmo" on public.message_reactions
  for insert to authenticated with check (user_id = (select auth.uid()) and private.can_see_message(message_id, (select auth.uid())));
create policy "reações: tirar a própria" on public.message_reactions
  for delete to authenticated using (user_id = (select auth.uid()));
create policy "reações diretas: as duas pessoas" on public.direct_reactions
  for select to authenticated using (private.can_see_direct(message_id, (select auth.uid())));
create policy "reações diretas: reagir como si mesmo" on public.direct_reactions
  for insert to authenticated with check (user_id = (select auth.uid()) and private.can_see_direct(message_id, (select auth.uid())));
create policy "reações diretas: tirar a própria" on public.direct_reactions
  for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.message_reactions, public.direct_reactions from anon, authenticated;
grant select, insert, delete on public.message_reactions, public.direct_reactions to authenticated;
alter table public.message_reactions replica identity full;
alter table public.direct_reactions replica identity full;

-- ───────────────────────── Figurinhas do Cenário ─────────────────────────
create table public.stickers (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 32),
  url text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index stickers_space_idx on public.stickers (space_id);
alter table public.stickers enable row level security;
create policy "figurinhas: membros veem" on public.stickers
  for select to authenticated using (private.is_space_member(space_id, (select auth.uid())));
create policy "figurinhas: quem gerencia tema adiciona" on public.stickers
  for insert to authenticated with check (private.space_permissions(space_id, (select auth.uid())) & 1024 <> 0 and created_by = (select auth.uid()));
create policy "figurinhas: quem gerencia tema apaga" on public.stickers
  for delete to authenticated using (private.space_permissions(space_id, (select auth.uid())) & 1024 <> 0);
revoke all on public.stickers from anon, authenticated;
grant select, insert, delete on public.stickers to authenticated;

-- ───────────────────────── Não lidas ─────────────────────────
create table public.channel_reads (
  user_id uuid not null references public.profiles (id) on delete cascade,
  channel_id uuid not null references public.channels (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, channel_id)
);
create table public.direct_reads (
  user_id uuid not null references public.profiles (id) on delete cascade,
  other_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, other_id)
);
alter table public.channel_reads enable row level security;
alter table public.direct_reads enable row level security;
create policy "lidas: só as próprias" on public.channel_reads for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "lidas diretas: só as próprias" on public.direct_reads for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.channel_reads, public.direct_reads from anon, authenticated;
grant select, insert, update on public.channel_reads, public.direct_reads to authenticated;

create function public.mark_channel_read(p_channel uuid) returns void
language sql security invoker set search_path = '' as $$
  insert into public.channel_reads (user_id, channel_id, last_read_at) values ((select auth.uid()), p_channel, now())
  on conflict (user_id, channel_id) do update set last_read_at = excluded.last_read_at
$$;
create function public.mark_direct_read(p_other uuid) returns void
language sql security invoker set search_path = '' as $$
  insert into public.direct_reads (user_id, other_id, last_read_at) values ((select auth.uid()), p_other, now())
  on conflict (user_id, other_id) do update set last_read_at = excluded.last_read_at
$$;

-- Não lidas por canal do Cenário (só canais que a pessoa vê; as próprias mensagens não contam).
create function public.channel_unread(p_space uuid)
returns table (channel_id uuid, unread integer, mentions integer)
language sql stable security invoker set search_path = '' as $$
  select m.channel_id, count(*)::int, count(*) filter (where (select auth.uid()) = any (m.mentions))::int
  from public.messages m
  left join public.channel_reads r on r.channel_id = m.channel_id and r.user_id = (select auth.uid())
  where m.space_id = p_space
    and m.author_id <> (select auth.uid())
    and m.created_at > coalesce(r.last_read_at, (select joined_at from public.space_members where space_id = p_space and user_id = (select auth.uid())))
  group by m.channel_id
$$;

-- Não lidas de todos os Cenários (bolinha na barra de Cenários).
create function public.space_unread()
returns table (space_id uuid, unread integer, mentions integer)
language sql stable security invoker set search_path = '' as $$
  select m.space_id, count(*)::int, count(*) filter (where (select auth.uid()) = any (m.mentions))::int
  from public.messages m
  join public.space_members sm on sm.space_id = m.space_id and sm.user_id = (select auth.uid())
  left join public.channel_reads r on r.channel_id = m.channel_id and r.user_id = (select auth.uid())
  where m.author_id <> (select auth.uid()) and m.created_at > coalesce(r.last_read_at, sm.joined_at)
  group by m.space_id
$$;

create function public.direct_unread()
returns table (other_id uuid, unread integer)
language sql stable security invoker set search_path = '' as $$
  select case when d.user_a = (select auth.uid()) then d.user_b else d.user_a end as other, count(*)::int
  from public.direct_messages d
  left join public.direct_reads r on r.user_id = (select auth.uid())
    and r.other_id = case when d.user_a = (select auth.uid()) then d.user_b else d.user_a end
  where (select auth.uid()) in (d.user_a, d.user_b)
    and d.author_id <> (select auth.uid())
    and d.created_at > coalesce(r.last_read_at, '-infinity'::timestamptz)
  group by 1
$$;

revoke all on function private.can_see_message(uuid, uuid), private.can_see_direct(uuid, uuid) from public, anon;
grant execute on function private.can_see_message(uuid, uuid), private.can_see_direct(uuid, uuid) to authenticated;
revoke execute on function public.mark_channel_read(uuid), public.mark_direct_read(uuid), public.channel_unread(uuid),
  public.space_unread(), public.direct_unread() from public, anon;
grant execute on function public.mark_channel_read(uuid), public.mark_direct_read(uuid), public.channel_unread(uuid),
  public.space_unread(), public.direct_unread() to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.message_reactions, public.direct_reactions;
  end if;
end;
$$;
