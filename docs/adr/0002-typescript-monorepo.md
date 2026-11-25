# 0002. TypeScript em monorepo pnpm + Turborepo

- **Status:** Aceita
- **Data:** 2026-11-25

## Contexto

Ficha, dados e tipos precisam ser os mesmos na web, no futuro app de desktop e no mobile. TypeScript é a linguagem de maior fluência de quem desenvolve.

## Decisão

TypeScript de ponta a ponta, num monorepo com pnpm workspaces e Turborepo:

- `apps/web`: o app Next.js.
- `packages/ui`: tokens e componentes.
- `packages/core`: regras de domínio sem React nem banco (ficha, fórmulas, permissões).
- `packages/db`: schema, migrações, RLS e tipos do banco.

Os pacotes internos são consumidos como código-fonte (sem etapa de build própria); o Next.js os transpila via `transpilePackages`.

## Consequências

- Tipos compartilhados entre front e back sem publicar pacotes.
- O Turborepo faz cache de lint, typecheck, testes e build por pacote.
- Se um pacote precisar ser usado fora do monorepo, ele ganha uma etapa de build.
