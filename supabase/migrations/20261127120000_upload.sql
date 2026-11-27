-- Upload (ADR 0016, decidido): imagens de perfil e de Cenário em buckets públicos; anexos de chat em bucket privado.
-- GIF aceito em avatar, banner e anexos.

-- ───────────────────────── Colunas ─────────────────────────
alter table public.profiles add column banner_url text;
alter table public.spaces add column icon_url text, add column banner_url text;
grant update (banner_url) on public.profiles to authenticated;
grant update (icon_url, banner_url) on public.spaces to authenticated;

-- Anexos: lista de { path, name, size, mime, width?, height? } (caminho no bucket "anexos").
alter table public.messages add column attachments jsonb not null default '[]'::jsonb;
alter table public.direct_messages add column attachments jsonb not null default '[]'::jsonb;

alter table public.messages drop constraint messages_content_check;
alter table public.messages add constraint messages_content_check
  check (char_length(content) <= 4000 and (char_length(content) >= 1 or jsonb_array_length(attachments) > 0));
alter table public.messages add constraint messages_attachments_check
  check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 10);

alter table public.direct_messages drop constraint direct_messages_content_check;
alter table public.direct_messages add constraint direct_messages_content_check
  check (char_length(content) <= 4000 and (char_length(content) >= 1 or jsonb_array_length(attachments) > 0));
alter table public.direct_messages add constraint direct_messages_attachments_check
  check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 10);

grant insert (attachments) on public.messages to authenticated;
grant insert (attachments) on public.direct_messages to authenticated;

-- Quem pode ler um anexo: c/<canal>/… quem vê o canal; d/<a>_<b>/… as duas pessoas da conversa.
create function private.can_read_attachment(p_name text, p_user uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_parts text[] := string_to_array(p_name, '/');
begin
  if v_parts[1] = 'c' then
    return private.channel_permissions(v_parts[2]::uuid, p_user) & 1 <> 0;
  elsif v_parts[1] = 'd' then
    return p_user::text = any (string_to_array(v_parts[2], '_'));
  end if;
  return false;
exception when others then
  return false;
end;
$$;

-- Quem pode subir: no canal, quem pode escrever nele; na conversa, amigos (e só na própria conversa).
create function private.can_write_attachment(p_name text, p_user uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_parts text[] := string_to_array(p_name, '/');
  v_pair text[];
begin
  if v_parts[1] = 'c' then
    return private.channel_permissions(v_parts[2]::uuid, p_user) & 2 <> 0;
  elsif v_parts[1] = 'd' then
    v_pair := string_to_array(v_parts[2], '_');
    return array_length(v_pair, 1) = 2 and p_user::text = any (v_pair) and v_pair[1] < v_pair[2]
      and private.are_friends(v_pair[1]::uuid, v_pair[2]::uuid);
  end if;
  return false;
exception when others then
  return false;
end;
$$;

revoke all on function private.can_read_attachment(text, uuid), private.can_write_attachment(text, uuid) from public, anon;
grant execute on function private.can_read_attachment(text, uuid), private.can_write_attachment(text, uuid) to authenticated;

-- ───────────────────────── Buckets e regras (só existem no Supabase) ─────────────────────────
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'storage') then
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
    ('perfis', 'perfis', true, 4194304, array['image/webp', 'image/gif', 'image/png', 'image/jpeg']),
    ('cenarios', 'cenarios', true, 4194304, array['image/webp', 'image/gif', 'image/png', 'image/jpeg']),
    ('anexos', 'anexos', false, 26214400, null)
  on conflict (id) do nothing;

  -- perfis/<user_id>/…: só a própria pessoa grava e apaga.
  execute $p$create policy "perfis: a própria pessoa grava" on storage.objects for insert to authenticated
    with check (bucket_id = 'perfis' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
  execute $p$create policy "perfis: a própria pessoa troca" on storage.objects for update to authenticated
    using (bucket_id = 'perfis' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
  execute $p$create policy "perfis: a própria pessoa apaga" on storage.objects for delete to authenticated
    using (bucket_id = 'perfis' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;

  -- cenarios/<space_id>/…: quem gerencia o tema (1024).
  execute $p$create policy "cenarios: quem gerencia tema grava" on storage.objects for insert to authenticated
    with check (bucket_id = 'cenarios' and private.space_permissions(((storage.foldername(name))[1])::uuid, (select auth.uid())) & 1024 <> 0)$p$;
  execute $p$create policy "cenarios: quem gerencia tema troca" on storage.objects for update to authenticated
    using (bucket_id = 'cenarios' and private.space_permissions(((storage.foldername(name))[1])::uuid, (select auth.uid())) & 1024 <> 0)$p$;
  execute $p$create policy "cenarios: quem gerencia tema apaga" on storage.objects for delete to authenticated
    using (bucket_id = 'cenarios' and private.space_permissions(((storage.foldername(name))[1])::uuid, (select auth.uid())) & 1024 <> 0)$p$;

  -- anexos: leitura e escrita pela regra do canal ou da conversa.
  execute $p$create policy "anexos: quem vê lê" on storage.objects for select to authenticated
    using (bucket_id = 'anexos' and private.can_read_attachment(name, (select auth.uid())))$p$;
  execute $p$create policy "anexos: quem escreve sobe" on storage.objects for insert to authenticated
    with check (bucket_id = 'anexos' and private.can_write_attachment(name, (select auth.uid())))$p$;
  execute $p$create policy "anexos: o autor apaga" on storage.objects for delete to authenticated
    using (bucket_id = 'anexos' and owner_id = (select auth.uid())::text)$p$;
end;
$$;


-- ───────────────────────── Imagens nas funções do social ─────────────────────────
drop function public.find_profile(text);
create function public.find_profile(p_username text)
returns table (id uuid, username text, display_name text, avatar_url text, banner_url text, color text, bio text, friendship text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.banner_url, p.color, p.bio,
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
drop function public.list_public_spaces(text);
create function public.list_public_spaces(p_query text default null)
returns table (id uuid, name text, short text, description text, color text, icon_url text, banner_url text, member_count integer, is_member boolean)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, s.short, s.description, s.color, s.icon_url, s.banner_url,
    (select count(*)::int from public.space_members m where m.space_id = s.id),
    private.is_space_member(s.id, (select auth.uid()))
  from public.spaces s
  where s.is_public
    and (p_query is null or btrim(p_query) = '' or s.name ilike '%' || btrim(p_query) || '%')
  order by 8 desc, s.created_at desc
  limit 60
$$;
revoke execute on function public.find_profile(text), public.list_public_spaces(text) from public, anon;
grant execute on function public.find_profile(text), public.list_public_spaces(text) to authenticated;
