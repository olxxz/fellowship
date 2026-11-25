# 0003. Next.js para a web

- **Status:** Aceita
- **Data:** 2026-11-25

## Contexto

A web é a primeira plataforma. Páginas de convite e perfis públicos se beneficiam de renderização no servidor, e o framework já é dominado.

## Decisão

Next.js com App Router. Carregamento por região com `loading.tsx` e `Suspense` (lista de canais, mensagens, membros).

## Consequências

- Componentes de `@fellowship/ui` devem funcionar em Server Components sempre que não guardarem estado; só os interativos levam `"use client"`.
- Propriedades estáticas como `Componente.Skeleton` não atravessam a fronteira `"use client"`, então componentes com esqueleto evitam ser client quando possível.
