# 0005. Sass indentado + CSS Modules + variáveis CSS

- **Status:** Aceita
- **Data:** 2026-11-25

## Contexto

O tema (app, Cenário, campanha) e a cor do personagem mudam em tempo de execução. A preferência pessoal é escrever estilos em Sass indentado, sem Tailwind.

## Decisão

Sass com sintaxe indentada e CSS Modules. Os tokens vivem em `packages/ui/tokens/tokens.json` e um script gera:

- `_tokens.sass`: variáveis CSS (`:root`, `[data-theme]` e a preferência do sistema). Entra **uma vez**, no CSS global.
- `_typography.sass`: mixins de texto, usados nos módulos.
- `tokens.css`: as mesmas variáveis em CSS puro.

Os módulos usam `@use` só de `typography` e `mixins`, que não geram CSS.

## Consequências

- A cor do personagem entra como `--player-color` no elemento, via `style`.
- O CI falha se os arquivos gerados estiverem desatualizados em relação ao JSON.
- O Prettier não formata `.sass`.
