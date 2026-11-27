-- Notificações (Web Push): inscrições por aparelho e quem deve ser avisado de uma mensagem.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
create policy "notificações: só as próprias" on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.push_subscriptions from anon, authenticated;
grant select, insert, delete on public.push_subscriptions to authenticated;

-- Para quem avisar de uma mensagem nova: nas conversas diretas, a outra pessoa; nos canais, quem foi
-- mencionado e pode ver o canal. Nunca o próprio autor. Só o servidor (service_role) chama.
create function public.push_targets(p_kind text, p_message uuid)
returns table (user_id uuid, endpoint text, p256dh text, auth text, title text, body text, url text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_author uuid;
  v_name text;
  v_content text;
  v_kind text;
  v_channel uuid;
  v_space uuid;
  v_channel_name text;
  v_space_name text;
  v_a uuid;
  v_b uuid;
  v_mentions uuid[];
  v_username text;
begin
  if p_kind = 'dm' then
    select d.author_id, d.content, d.kind, d.user_a, d.user_b into v_author, v_content, v_kind, v_a, v_b
    from public.direct_messages d where d.id = p_message;
    if v_author is null then return; end if;
    select display_name, username into v_name, v_username from public.profiles where id = v_author;
    return query
      select s.user_id, s.endpoint, s.p256dh, s.auth, v_name,
        case when v_kind = 'figurinha' then 'Mandou uma figurinha' when v_content = '' then 'Mandou um anexo' else left(v_content, 140) end,
        '/mensagens/' || v_username
      from public.push_subscriptions s
      where s.user_id = case when v_author = v_a then v_b else v_a end;
  else
    select m.author_id, m.content, m.kind, m.channel_id, m.space_id, m.mentions into v_author, v_content, v_kind, v_channel, v_space, v_mentions
    from public.messages m where m.id = p_message;
    if v_author is null then return; end if;
    select display_name into v_name from public.profiles where id = v_author;
    select name into v_channel_name from public.channels where id = v_channel;
    select name into v_space_name from public.spaces where id = v_space;
    return query
      select s.user_id, s.endpoint, s.p256dh, s.auth, v_name || ' em #' || v_channel_name || ' · ' || v_space_name,
        case when v_kind = 'figurinha' then 'Mandou uma figurinha' when v_content = '' then 'Mandou um anexo' else left(v_content, 140) end,
        '/c/' || v_space || '/' || v_channel
      from public.push_subscriptions s
      where s.user_id = any (v_mentions) and s.user_id <> v_author
        and private.channel_permissions(v_channel, s.user_id) & 1 <> 0;
  end if;
end;
$$;

revoke execute on function public.push_targets(text, uuid) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.push_targets(text, uuid) to service_role;
    grant delete on public.push_subscriptions to service_role;
  end if;
end;
$$;
