# Fellowship

Fellowship (nome provisório) é um app para jogar RPG de mesa online: Cenários com canais, campanhas com Mesa,
ficha modular, dados e voz, online ou presencial. Substitui a combinação Discord + planilha + rolador de dados + VTT.

- [Especificação do projeto](docs/especificacao.md)
- [Design system](docs/design-system/README.md)
- [Decisões de arquitetura (ADRs)](docs/adr/README.md)

## Estrutura

```
apps/
  web/            Next.js (App Router). /design-system mostra os componentes nos dois temas.
packages/
  ui/             Tokens (tokens.json → Sass e CSS) e componentes em Sass indentado + CSS Modules
  core/           Regras de domínio sem React nem banco (ficha, fórmulas, permissões)
  db/             Schema, migrações e Row Level Security do Supabase (ainda vazio)
docs/
  especificacao.md
  design-system/
  adr/
```

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
- [ ] Wireframe da Mesa no desktop e no celular
- [ ] Teste técnico do LiveKit (chamada + detecção de quem fala)
- [ ] Schema do banco com as regras de Row Level Security
