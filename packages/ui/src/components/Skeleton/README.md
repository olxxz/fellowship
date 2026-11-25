# Skeleton

Placeholder de carregamento: cada componente tem a sua versão (`Componente.Skeleton`) com as mesmas dimensões do conteúdo real, para a tela não pular quando os dados chegam.

- Blocos em `bg-input`, raio `radius-sm` (círculos para avatares).
- Aparece só depois de ~200ms; carregamentos rápidos não piscam.
- Pulsa entre 50% e 100% de opacidade em 1.4s; com `prefers-reduced-motion`, fica parado.
- Linhas de texto com larguras variadas (entre 20% e 85%) para parecer conteúdo.
- Anuncia "Carregando…" uma vez para leitores de tela (`aria-busy` na região).
- Cada região carrega sozinha (lista de canais, mensagens, membros).

## No código

```tsx
<SkeletonRegion loading={carregando} fallback={<><ChannelRow.Skeleton /><ChannelRow.Skeleton width="40%" /></>}>
  {canais}
</SkeletonRegion>
<Skeleton width={40} height={40} circle />
<SkeletonText lines={3} />
```

O atraso de 200ms e o pulso são só CSS, então funcionam também no HTML renderizado no servidor.
