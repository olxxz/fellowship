# 0004. Supabase para banco, login, tempo real e arquivos

- **Status:** Aceita
- **Data:** 2026-11-25

## Contexto

O app precisa de Postgres com isolamento por campanha, login, mensagens em tempo real e upload de imagens, sem manter servidores.

## Decisão

Supabase: Postgres, Auth, Realtime e Storage. O isolamento usa Row Level Security; a busca usa `tsvector` em português; `pgvector` fica para a IA.

## Consequências

- Todo registro carrega `spaceId` e, em campanhas, `campaignId`, e as regras de RLS filtram por eles.
- Permissões em bitmask são checadas no servidor e nas políticas de RLS.
- A regra de conflito entre dois cargos precisa de uma ADR antes do schema de permissões.
