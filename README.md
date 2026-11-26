# Fellowship

Fellowship (nome provisório) é um app para jogar RPG de mesa online: Cenários com canais, campanhas com Mesa,
ficha modular, dados e voz, online ou presencial. Substitui a combinação Discord + planilha + rolador de dados + VTT.

- [Especificação do projeto](docs/especificacao.md)
- [Design system](docs/design-system/README.md)
- [Decisões de arquitetura (ADRs)](docs/adr/README.md)

## Estrutura

```
apps/
  web/            Next.js (App Router): protótipo navegável com dados de exemplo e /design-system
packages/
  ui/             Tokens (tokens.json → Sass e CSS) e componentes em Sass indentado + CSS Modules
  core/           Regras de domínio sem React nem banco (ficha, fórmulas, permissões)
  db/             Schema, migrações e Row Level Security do Supabase (ainda vazio)
docs/
  especificacao.md
  design-system/
  adr/
```

## Protótipo

O app web hoje é um **protótipo navegável com dados de exemplo**, sem servidor: tudo vive no navegador e some ao recarregar.
Ele serve de wireframe da Mesa e da estrutura do app antes do Supabase e do LiveKit.

- **Estrutura em 4 colunas:** barra de Cenários, barra do Cenário (canais e campanhas) ou da campanha (com voltar), conteúdo e membros recolhíveis. No celular, a navegação vira gaveta.
- **Canais de texto** com envio otimista, mensagens agrupadas por autor e `/r 1d20+5` para rolar dados. Anúncios só o Narrador escreve.
- **Mesa:** participantes com simulação de quem fala, cena atual, chat ingame e outgame lado a lado, bandeja de dados, ficha em gaveta e, no modo mestre, pedir teste, rolagem oculta e próxima cena. No celular, abas Mesa, Chat e Ficha.
- **Escolher quem você é** (Ana, Bruno, Carla, Dani ou Rafa, o mestre) e **tema escuro, claro ou sistema** pelo menu de configurações (engrenagem no painel do usuário).
- **Sem metagame:** sussurros de outros jogadores e rolagens ocultas não aparecem para o jogador.

## Voz (LiveKit)

A Mesa tem voz de verdade no deploy da Vercel. No GitHub Pages, que é estático, ela continua sem voz e simula quem fala.

1. Cada pessoa abre a Mesa, escolhe quem é em **engrenagem → Você é** e clica em **Entrar na voz**.
2. O servidor gera um token para a sala daquela campanha (`POST /api/livekit/token`) e o navegador conecta ao LiveKit.
3. O card de cada personagem acende quando a pessoa fala, mostra mutado, vídeo da câmera ou "fora da chamada".

Variáveis (veja `apps/web/.env.example`): `NEXT_PUBLIC_LIVEKIT_URL`, `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET`. Localmente vão em `apps/web/.env.local`; na Vercel, em Settings → Environment Variables. A key e o segredo nunca levam o prefixo `NEXT_PUBLIC_`.

Ainda não há login: quem tem o link pode entrar como qualquer um do grupo ([ADR 0013](docs/adr/0013-token-de-voz-sem-login.md)). Chat e rolagens continuam locais em cada navegador até o Supabase.

## Dados de exemplo

Os dados de exemplo ficam em `apps/web/lib/demo`. O rolador de dados do protótipo roda no navegador; no app de verdade, o servidor rola ([ADR 0008](docs/adr/0008-dados-no-servidor.md)).

## Como rodar

Requisitos: Node 22.12 ou mais novo e pnpm 10 (`corepack enable` instala a versão certa).

```sh
pnpm install
pnpm dev          # http://localhost:3000
```

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Sobe o app web em modo de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm lint` | ESLint em todos os pacotes |
| `pnpm typecheck` | TypeScript em todos os pacotes |
| `pnpm test` | Vitest (componentes e contraste da paleta) |
| `pnpm check` | lint + typecheck + test |
| `pnpm tokens` | Regera os arquivos de tokens a partir de `packages/ui/tokens/tokens.json` |

**Deploy:** cada push na `main` publica o app como site estático no GitHub Pages (`.github/workflows/pages.yml`), em https://olxxz.github.io/fellowship/. Para gerar o mesmo build localmente: `STATIC_EXPORT=1 PAGES_BASE_PATH=/fellowship pnpm --filter @fellowship/web build` (sai em `apps/web/out`).

## Convenções

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (`feat(ui): …`, `fix(web): …`, `docs(adr): …`).
- **Código** em inglês; **interface e documentação** em português do Brasil, com os nomes do domínio fixos: Cenário, campanha, Mesa, mestre, jogador, ficha, compêndio.
- **Estilos:** Sass indentado + CSS Modules, sempre com os tokens (`var(--…)`). O Prettier não formata `.sass`.
- **Decisões:** toda escolha de arquitetura vira uma ADR em `docs/adr`.
- **CI:** cada pull request roda tokens, lint, typecheck, testes e build.

## Situação

Fase 0, começando. Próximos passos da especificação:

- [x] Definir nome, paleta, tipografia e tokens
- [x] Criar o monorepo, o README e os primeiros ADRs
- [x] Wireframe da Mesa no desktop e no celular (protótipo navegável)
- [ ] Teste técnico do LiveKit (chamada + detecção de quem fala): código pronto, falta testar com o grupo
- [ ] Schema do banco com as regras de Row Level Security
