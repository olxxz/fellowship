-- Criar canais e categorias em Cenários que já existem. Exige Gerenciar canais (256).
-- O canal entra no fim da categoria escolhida (ou da lista sem categoria).

create function public.create_category(p_space uuid, p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_id uuid;
begin
  if v_user is null or private.space_permissions(p_space, v_user) & 256 = 0 then
    raise exception 'Você não pode gerenciar canais neste Cenário.' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 40 then
    raise exception 'O nome da categoria vai de 1 a 40 caracteres.' using errcode = '22023';
  end if;
  insert into public.categories (space_id, name, position)
  values (p_space, btrim(p_name), coalesce((select max(position) + 1 from public.categories where space_id = p_space), 0))
  returning id into v_id;
  return v_id;
end;
$$;

create function public.create_channel(p_space uuid, p_category uuid, p_kind text, p_name text, p_topic text default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_name text := btrim(coalesce(p_name, ''));
  v_topic text := nullif(btrim(coalesce(p_topic, '')), '');
  v_id uuid;
begin
  if v_user is null or private.space_permissions(p_space, v_user) & 256 = 0 then
    raise exception 'Você não pode gerenciar canais neste Cenário.' using errcode = '42501';
  end if;
  if p_kind not in ('texto', 'anuncios', 'galeria', 'voz', 'funcional') then
    raise exception 'Tipo de canal inválido.' using errcode = '22023';
  end if;
  if char_length(v_name) not between 1 and 40 then
    raise exception 'O nome do canal vai de 1 a 40 caracteres.' using errcode = '22023';
  end if;
  if char_length(v_topic) > 200 then
    raise exception 'A descrição vai até 200 caracteres.' using errcode = '22023';
  end if;
  if p_category is not null and not exists (select 1 from public.categories where id = p_category and space_id = p_space) then
    raise exception 'Categoria não encontrada neste Cenário.' using errcode = '22023';
  end if;
  insert into public.channels (space_id, category_id, kind, name, topic, position)
  values (
    p_space, p_category, p_kind, v_name, v_topic,
    coalesce((select max(position) + 1 from public.channels where space_id = p_space and category_id is not distinct from p_category), 0)
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.create_category(uuid, text) from public, anon;
revoke execute on function public.create_channel(uuid, uuid, text, text, text) from public, anon;
grant execute on function public.create_category(uuid, text) to authenticated;
grant execute on function public.create_channel(uuid, uuid, text, text, text) to authenticated;
