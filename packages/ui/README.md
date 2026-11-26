# @fellowship/ui

Tokens e componentes do design system do Fellowship. Diretrizes completas em [`docs/design-system`](../../docs/design-system/README.md).

## Tokens

`tokens/tokens.json` é a fonte da verdade. Depois de editá-lo:

```sh
pnpm tokens        # gera src/styles/_tokens.sass, src/styles/_typography.sass e tokens.css
```

O CI roda `pnpm --filter @fellowship/ui tokens:check` e falha se os arquivos gerados estiverem desatualizados.

| Arquivo | Para quê |
| --- | --- |
| `src/styles/_tokens.sass` | Variáveis CSS dos dois temas. Entra só no CSS global. |
| `src/styles/_typography.sass` | Mixins `text-display`, `text-body`, `text-overline`… |
| `src/styles/_mixins.sass` | `focus-ring`, `visually-hidden`, `truncate`, `mobile`, `desktop`, `reduced-motion` |
| `src/styles/globals.sass` | CSS global do app (tokens + base). Importar uma vez no layout raiz. |
| `tokens.css` | As variáveis em CSS puro, para quem não usa Sass. |

## Componentes

| Componente | Grupo | Client? |
| --- | --- | --- |
| [Button / IconButton](src/components/Button/README.md) | Ações | Não |
| [ChannelRow](src/components/ChannelRow/README.md) / ChannelCategory | Navegação | Só `ChannelCategory` |
| [CampaignCard](src/components/CampaignCard/README.md) | Navegação | Não |
| [ParticipantCard](src/components/ParticipantCard/README.md) | Mesa | Não |
| [RollCard](src/components/RollCard/README.md) | Mesa | Não |
| [Skeleton](src/components/Skeleton/README.md) / SkeletonText / SkeletonRegion | Feedback | Não |
| Avatar | Identidade | Não |
| ChatMessage / ChatNotice | Chat | Não |
| ResourceBar | Ficha | Não |
| Sheet (Base UI Dialog) | Sobre Base UI | Sim |
| Tabs (Base UI Tabs) | Sobre Base UI | Sim |
| Menu (Base UI Menu) | Sobre Base UI | Sim |
| Popover (Base UI Popover) | Sobre Base UI | Sim |
| Icon | Sistema | Não |

Todo componente com conteúdo assíncrono exporta `Componente.Skeleton` com as mesmas dimensões.
`Tabs`, `Menu` e `Popover` são objetos com as partes (`Tabs.Root`, `Menu.Popup`…): por serem client, use-os dentro de componentes client.
Links: `ChannelRow` e `CampaignCard` aceitam `linkAs={Link}` para navegar com o `Link` do Next.js (necessário com `basePath`, como no GitHub Pages).
Os componentes sem estado funcionam em Server Components; por isso `Componente.Skeleton` pode ser usado direto numa página do App Router.

## Testes

```sh
pnpm --filter @fellowship/ui test
```

Testes de comportamento e acessibilidade dos componentes (Testing Library) e o teste de contraste da paleta.
