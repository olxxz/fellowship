# 0008. Dados rolados no servidor com biblioteca pronta

- **Status:** Aceita
- **Data:** 2026-11-25

## Contexto

Rolagens decidem o jogo; resultados gerados no navegador podem ser manipulados, e reimplementar um parser de notação de dados é trabalho desnecessário.

## Decisão

A notação (`1d20+5`, `2d20kh1`) é interpretada por uma biblioteca pronta (ex.: `@dice-roller/rpg-dice-roller`) e resolvida no servidor. O resultado é gravado como `Roll` ligado a uma `Message`.

## Consequências

- O `RollCard` só exibe; nunca rola.
- Rolagens ocultas não enviam os valores para quem não é mestre.
- Fórmulas da ficha (`floor((@for - 10) / 2)`) usam um interpretador próprio e seguro, nunca `eval`.
