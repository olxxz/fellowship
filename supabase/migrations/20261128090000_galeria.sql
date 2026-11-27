-- Canal de galeria: publicações (mensagens com imagens) e comentários (respostas) entram pela mesma regra de postar.
create or replace function private.can_post(p_channel uuid, p_user uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_kind text;
  v_perms integer;
begin
  select kind into v_kind from public.channels where id = p_channel;
  if v_kind is null or v_kind not in ('texto', 'anuncios', 'galeria') then
    return false;
  end if;
  v_perms := private.channel_permissions(p_channel, p_user);
  if v_perms & 2 = 0 then
    return false;
  end if;
  return v_kind <> 'anuncios' or v_perms & 8 <> 0;
end;
$$;
