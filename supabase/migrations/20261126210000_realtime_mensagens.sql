-- Garante que public.messages está na publicação do Realtime (a migração da fase 0 só adicionava se a publicação já existisse).
-- Idempotente: cria a publicação se faltar e só adiciona a tabela se ela ainda não estiver lá.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

-- DELETE no Realtime precisa da linha antiga para saber o id (e o canal) da mensagem removida.
alter table public.messages replica identity full;
