# RollCard

Cartão que aparece no chat a cada rolagem, gerada no servidor.

- **Conteúdo:** quem rolou e o quê ("Brom rolou Atletismo"), a fórmula com os dados individuais (`1d20 + 4 → [15] + 4`) em Space Grotesk e o total em `number-xl` na cor do personagem.
- **Superfície:** `mesa-surface` com borda `mesa-border`, em qualquer chat.
- **Oculta:** borda tracejada `border-strong`, texto "Só o mestre vê o resultado" e "?" no lugar do total. O mestre vê o valor real.
- **Crítico e falha crítica:** o total ganha um rótulo ("20 natural") além da cor; nunca só a cor.
- **Vantagem e desvantagem:** os dois dados aparecem, e o descartado fica riscado em `text-faint`.
- Ao tocar: abre o detalhe com quem pediu o teste e a dificuldade, se o mestre revelar.

## No código

```tsx
<RollCard roller="Brom" label="Atletismo" formula="1d20 + 4" dice={[{ value: 15 }]} modifier={4} total={19} color={2} />
<RollCard roller="Kael" formula="2d20kh1 + 6" dice={[{ value: 20 }, { value: 8, discarded: true }]} modifier={6} total={26}
          critical={{ kind: "success", label: "20 natural" }} />
<RollCard roller="Narrador" formula="1d20" dice={[{ value: 7 }]} total={7} hidden viewerIsMaster={souMestre} />
```

O cartão só exibe; o resultado vem sempre do servidor (`Roll`). Para o jogador, uma rolagem oculta não deve nem chegar com os valores: o servidor manda só `hidden` e o cartão mostra "?".
