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
  core/           Regras de domínio sem React nem banco (permissões em bitmask; ficha e fórmulas depois)
  db/             Tipos do banco e testes das regras de acesso (RLS) num Postgres em memória
supabase/
  migrations/     Schema do Postgres com RLS, aplicado pela integração do Supabase com o GitHub
docs/
  especificacao.md
  design-system/
  adr/
```

## App com login (Vercel)

Na Vercel o app tem conta de verdade, com dados no Supabase:

- **Criar conta e entrar** (`/cadastro`, `/entrar`) com Google ou com e-mail e senha, com confirmação por e-mail e "Esqueci minha senha". Na primeira vez, o perfil nasce com nome (e foto, no Google).
- **Convites por link:** "Convidar" na barra do Cenário gera um link com validade e limite de usos. Quem abre vê a prévia (até sem conta), cria a conta ou entra, e cai no Cenário como Membro. Os convites ativos ficam nas configurações do Cenário, onde dá para revogar.
- **Meu perfil** (`/conta`) e **configurações do Cenário** (engrenagem no banner): nome, bio, iniciais, descrição e **cor livre** (sugestões ou qualquer cor; o texto por cima fica claro ou escuro sozinho para dar leitura).
- **Início** (`/inicio`) com os Cenários da conta e **Criar Cenário** (`/criar-cenario`): nome, descrição, cor e canais iniciais.
- **Cenário** (`/c/...`): só os canais que a conta pode ver, chat em tempo real nos canais de texto e membros agrupados por cargo.
- **Cada conta vê só o que pode:** quem decide é o Row Level Security do Postgres, não a interface. Regras em `supabase/migrations` e testes em `packages/db/test`.

### Configurar o login com Google (uma vez)

1. **Google Cloud Console** → APIs e serviços → Tela de consentimento OAuth (externo, nome Fellowship). Depois, Credenciais → Criar ID do cliente OAuth → Aplicativo da Web:
   - Origens JavaScript autorizadas: o domínio da Vercel (ex.: `https://fellowship.vercel.app`) e `http://localhost:3000`.
   - URI de redirecionamento autorizado: `https://<ref-do-projeto>.supabase.co/auth/v1/callback` (aparece na tela do provedor Google no Supabase).
2. **Supabase** → Authentication → Sign In / Providers → Google: ative e cole o Client ID e o Client Secret.
3. **Supabase** → Authentication → URL Configuration:
   - Site URL: o domínio da Vercel.
   - Redirect URLs: `https://<domínio-da-vercel>/auth/callback`, `http://localhost:3000/auth/callback` e, para as prévias da Vercel, `https://*-<sua-conta>.vercel.app/auth/callback`.
4. **Vercel** → Settings → Environment Variables: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (a integração Supabase da Vercel pode criar com o nome antigo, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, que também funciona). Faça um novo deploy depois de mudar variáveis.

A senha do banco não vai em lugar nenhum do app: guarde no seu gerenciador de senhas.

### Contas com e-mail e senha

1. **Supabase → Authentication → Sign In / Providers → Email:** deixe ligado.
2. **Confirmação por e-mail:** o serviço de e-mail padrão do Supabase tem limite baixo de envios por hora e, em projetos novos, só envia para quem faz parte da equipe do projeto. Para os amigos receberem o link de confirmação, escolha uma das opções:
   - configurar um SMTP próprio em **Authentication → Emails → SMTP Settings** (ex.: Resend, que tem plano grátis); ou
   - desligar **Confirm email** no provedor Email, enquanto o app é só do grupo. Aí a conta já entra direto ao se cadastrar.
3. **Opcional, para o link funcionar mesmo abrindo o e-mail em outro aparelho:** em **Authentication → Emails → Templates**, troque o link dos modelos "Confirm signup" e "Reset password" por `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` (no de senha, `type=recovery`). Sem isso, o link padrão funciona quando aberto no mesmo navegador do cadastro.

### Banco de dados

As migrações ficam em `supabase/migrations` e a **integração do Supabase com o GitHub** aplica cada uma ao dar push na `main`. Para mudar o banco, crie um arquivo novo (nunca edite uma migração já aplicada). Os testes de RLS rodam num Postgres em memória (PGlite) com `pnpm --filter @fellowship/db test`.

## Protótipo (`/demo`)

Além do app com login, há um **protótipo navegável com dados de exemplo** em `/demo` (também publicado no GitHub Pages). Tudo nele vive no navegador e some ao recarregar.
Ele serve de wireframe da Mesa até as campanhas reais (fase 1).

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

Com o login configurado, só quem tem conta recebe token de voz. Na Mesa do protótipo, cada pessoa ainda escolhe qual usuário de exemplo é ([ADR 0013](docs/adr/0013-token-de-voz-sem-login.md)); isso acaba quando as campanhas reais chegarem.

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
| `pnpm test` | Vitest (componentes, contraste da paleta, regras de acesso do banco, rolador e token) |
| `pnpm check` | lint + typecheck + test |
| `pnpm tokens` | Regera os arquivos de tokens a partir de `packages/ui/tokens/tokens.json` |

**Deploy:**
- **Vercel** (app com login e voz): cada push na `main` publica. Root Directory `apps/web`.
- **GitHub Pages** (protótipo e design system, estático): `.github/workflows/pages.yml`, em https://olxxz.github.io/fellowship/. O workflow remove `app/(conta)` antes do build ([ADR 0015](docs/adr/0015-app-na-vercel-prototipo-no-pages.md)).
- **Supabase**: a integração com o GitHub aplica `supabase/migrations` a cada push na `main`.

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
- [x] Schema do banco com as regras de Row Level Security (fase 0: Cenários, cargos, canais, mensagens)
- [x] Login com Google e criar Cenário
- [x] Convites por link para o grupo entrar nos Cenários
- [x] Contas com e-mail e senha, perfil e configurações do Cenário com cor livre
- [ ] Configurações do Cenário: canais, categorias e cargos
