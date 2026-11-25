# Fellowship

Fellowship (nome provisório) é um app para jogar RPG de mesa: Cenários com canais, campanhas com Mesa, ficha modular, dados e voz, online ou presencial. Este design system guarda as cores, a tipografia, os espaçamentos e os componentes que a interface usa, nos temas escuro e claro.

## Princípios

- **A mesa é o palco.** A interface é neutra e quieta. Cor forte aparece só nos personagens (`player-1` a `player-6`), na identidade da campanha (`mesa-gold`) e em estados importantes.
- **Uma ênfase por vez.** Quem está falando, a rolagem nova, o pedido do mestre. Se tudo brilha, nada brilha.
- **Ingame tem textura, outgame é neutro.** O chat ingame usa `chat-ingame` e o nome do personagem na cor dele; o outgame usa as superfícies neutras e o perfil do jogador.
- **Parecido com o Discord, com cara de RPG.** Barra de Cenários à esquerda, canais, conteúdo e membros. Nada de "#": cada tipo de canal tem ícone próprio.
- **Confortável por horas.** Sessões duram horas, então o texto tem 15px no chat, linhas com 44px de altura no celular e contraste mínimo de 4.5:1.

## Cores

O tema **escuro** é o padrão; o **claro** usa os mesmos nomes de token. O app também segue o sistema operacional.

| Grupo | Tokens | Regra |
| --- | --- | --- |
| Superfícies | `bg-rail` → `bg-sidebar` → `bg-content` | Da borda para o centro, cada camada fica um passo mais clara (no escuro) ou mais branca (no claro). |
| Elevação | `bg-raised`, `bg-input` | Linha ativa, botões secundários, campos. Nunca use sombra para isso. |
| Texto | `text`, `text-muted`, `text-faint` | `text-faint` só para rótulos em caixa alta e contadores. |
| Destaque do app | `accent`, `accent-text`, `on-accent`, `focus-ring` | Um botão principal por tela. |
| Mesa e campanha | `mesa-gold`, `mesa-ink`, `mesa-surface`, `mesa-border`, `mesa-text` | Tudo o que é "jogo": rolar dados, ferramentas do mestre, pedido de teste, cards de campanha. |
| Personagens | `player-1` … `player-6` | O jogador escolhe uma por campanha. Usada no anel de quem fala, no nome do personagem e no token. |
| Estados | `success`, `danger`, `danger-soft`, `warning` | `danger` só para ações destrutivas e sair. |
| Ficha | `vital-hp`, `vital-mana` | Barras de recursos. |

**Cor nunca sozinha:** quem fala tem anel na cor do personagem **e** um rótulo para leitores de tela; mutado tem ícone, não só vermelho.

## Tipografia

- **Space Grotesk** (`display`) para nomes de Cenário, campanha e personagem, títulos e números de jogo (modificadores, totais de rolagem).
- **Inter** (`sans`) para todo o resto.
- As duas vêm do Google Fonts: `family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700`.
- Estilos: `display-xl`, `display`, `title`, `number-xl`, `body`, `body-sm`, `label`, `caption`, `overline`.

## Espaço e forma

- Grade de 4px: `space-1` (4) até `space-12` (48). Padding da área de conteúdo: `space-5`; cards: `space-4`.
- Raios: `radius-md` para linhas e botões, `radius-lg` para cards e campos, `radius-xl` para painéis e ficha, `radius-full` para avatares e pills.
- Alvos de toque com no mínimo `size-touch` (44px).
- Layout desktop: `size-rail` (72) + `size-sidebar` (264) + conteúdo + `size-members` (220, recolhível).

## Ícones

Traço de 1.8px, cantos e pontas arredondados, grade de 24px, sempre `currentColor`. Ícones por tipo de canal: megafone (anúncios), pergaminho (regras), calendário (agenda), balão (conversa), imagem (galeria), alto-falante (voz), d20 (Mesa), aspas (ingame), cadeado (sussurros). Compêndio: garra (bestiário), espada (itens), brilho (magias), mapa (atlas), bandeira (facções).

## Estados de todo componente

Todo componente tem oito estados: padrão, hover, foco, ativo, desabilitado, **carregando**, vazio e erro.

- **Esqueleto:** blocos em `bg-input` com as mesmas dimensões do conteúdo real. Aparecem depois de ~200ms, pulsam devagar e param com `prefers-reduced-motion`.
- **Vazio:** uma frase e uma ação ("Nenhuma campanha ainda — criar campanha").
- **Erro:** linguagem humana + "Tentar de novo".
- **Otimista:** mensagem enviada aparece na hora, com opacidade reduzida até confirmar.

## Temas de Cenário e de campanha

Um tema pronto (Medieval, Cyberpunk, Horror) só sobrescreve `accent`, `accent-text`, os tokens `mesa-*` e `chat-ingame`, e troca a fonte de títulos e o conjunto de ícones dos canais. Navegação, layout, texto corrido e ícones de sistema nunca mudam. Cada tema tem versão escura e clara.

## Como usar no código (Sass + variáveis CSS)

O app usa Sass (sintaxe indentada) e CSS Modules, sem Tailwind. Os tokens viram **variáveis CSS**, porque tema e cor de personagem mudam em tempo de execução. A fonte da verdade é `packages/ui/tokens/tokens.json`; `pnpm tokens` gera `_tokens.sass`, `_typography.sass` e `tokens.css` (ver [ADR 0005](../adr/0005-sass-css-modules.md)).

As variáveis entram **uma vez**, no CSS global (`@fellowship/ui/styles/globals.sass`). Os CSS Modules usam só mixins, que não geram CSS:

```sass
@use "../../styles/typography" as *
@use "../../styles/mixins" as *

.card
  background: var(--bg-raised)
  border-radius: var(--radius-lg)
  padding: var(--space-4)
  @include text-body
  &:focus-visible
    @include focus-ring
  &[data-speaking="true"]
    box-shadow: 0 0 0 3px var(--player-color, var(--player-1))
```

- O tema escuro fica em `:root`; o claro em `[data-theme="light"]`; sem `data-theme`, o app segue o sistema.
- A cor de cada personagem entra como `--player-color` no elemento (via `style`, com `playerColorStyle(n)`), apontando para um dos `player-*`.
- Comportamento acessível de modais, menus e selects vem do Base UI (headless); o visual é todo próprio.

## Tom de voz

Português do Brasil, frases curtas, tom de mesa entre amigos sem virar piada. Os nomes do domínio são fixos: **Cenário**, **campanha**, **Mesa**, **mestre**, **jogador**, **ficha**, **compêndio**. Botões dizem a ação ("Rolar 1d20 + 4", "Entrar na Mesa"), nunca "OK".

## Contraste: lacunas conhecidas

O teste `packages/ui/test/contrast.test.ts` valida as combinações que a interface usa, nos dois temas. Ainda abaixo de 4.5:1 no tema **claro**:

| Combinação | Contraste | Onde aparece |
| --- | --- | --- |
| `player-1`, `-2`, `-3`, `-4`, `-6` sobre `chat-ingame` | 3.3 a 4.2:1 | Nome do personagem em texto pequeno no chat ingame |
| `text-faint` sobre `bg-raised` | 4.3:1 | Complemento da linha de canal ativa ("2 na sala") |

Como borda e texto grande (o total da rolagem), as cores de personagem passam de 3:1. Para o nome no chat, falta decidir entre escurecer esses tokens no tema claro ou calcular `--player-color-contrast` como a especificação prevê. Quando uma lacuna for corrigida, o teste falha para lembrar de movê-la para a lista principal.
