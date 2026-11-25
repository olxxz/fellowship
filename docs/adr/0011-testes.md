# 0011. Vitest e Playwright

- **Status:** Aceita
- **Data:** 2026-11-25

## Contexto

Componentes, regras de domínio e fluxos completos precisam de testes que rodem a cada pull request.

## Decisão

Vitest para testes de unidade e de componente (com Testing Library e jsdom); Playwright para os fluxos A a D da especificação. O CI roda tokens, lint, typecheck, testes e build.

## Consequências

- O Playwright entra com o primeiro fluxo de ponta a ponta (login e Cenário).
- A paleta tem um teste de contraste (WCAG 2.2) que roda junto com os testes de `@fellowship/ui`.
