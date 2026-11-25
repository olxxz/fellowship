# ChannelRow

Linha da lista de canais: ícone do tipo de canal, nome e um complemento opcional à direita.

- **Ícone por tipo**, nunca "#": anúncios (megafone), regras (pergaminho), agenda (calendário), conversa (balão), galeria (imagem), voz (alto-falante), Mesa (d20).
- **Estados:** normal em `text-muted`; ativo com fundo `bg-raised` e texto `text`; não lido com nome em 600 e ponto branco à direita; hover com fundo `bg-raised` a 50%.
- **Complemento:** contador ou status em `caption` (`text-faint`), horário da agenda em `mesa-text`, pessoas na sala de voz.
- Altura 36px no desktop, 44px no celular. Raio `radius-md`.
- Categorias acima das linhas em `overline` (`text-faint`), recolhíveis.
- Engrenagem de configurações aparece só no hover (desktop) ou no toque longo (celular).

## No código

```tsx
<ChannelCategory name="Conversa">
  <ChannelRow icon="chat" name="Geral" href="/c/geral" active />
  <ChannelRow icon="calendar" name="Agenda" meta="qui 20h" metaTone="mesa" />
  <ChannelRow icon="voice" name="Taverna" meta="2 na sala" onSettings={abrirConfig} />
</ChannelCategory>
<ChannelRow.Skeleton width="40%" />
```

`ChannelRow` funciona em Server Components; `ChannelCategory` é client (guarda o estado aberto/fechado).
