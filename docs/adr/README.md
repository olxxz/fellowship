# Registros de decisão (ADR)

Cada decisão de arquitetura vira um arquivo curto aqui: contexto, decisão e consequências.
Copie `0000-modelo.md`, use o próximo número e abra um pull request. Uma ADR aceita não é editada;
se a decisão mudar, uma nova ADR a substitui e a antiga ganha o status "Substituída por NNNN".

| # | Decisão | Status |
| --- | --- | --- |
| [0001](0001-registrar-decisoes.md) | Registrar decisões em ADRs | Aceita |
| [0002](0002-typescript-monorepo.md) | TypeScript em monorepo pnpm + Turborepo | Aceita |
| [0003](0003-nextjs.md) | Next.js para a web | Aceita |
| [0004](0004-supabase.md) | Supabase para banco, login, tempo real e arquivos | Aceita |
| [0005](0005-sass-css-modules.md) | Sass indentado + CSS Modules + variáveis CSS | Aceita |
| [0006](0006-base-ui.md) | Base UI para comportamento acessível | Aceita |
| [0007](0007-zod.md) | Zod para validação | Aceita |
| [0008](0008-dados-no-servidor.md) | Dados rolados no servidor com biblioteca pronta | Aceita |
| [0009](0009-livekit.md) | LiveKit para voz e vídeo | Aceita |
| [0010](0010-pwa-primeiro.md) | PWA primeiro, Expo depois | Aceita |
| [0011](0011-testes.md) | Vitest e Playwright | Aceita |
| [0012](0012-hospedagem.md) | Vercel + Supabase Cloud + LiveKit Cloud | Aceita |
| [0013](0013-token-de-voz-sem-login.md) | Token de voz sem login até o Supabase | Aceita |

**Pendentes**

- Conflito de permissões entre dois cargos (antes do schema de permissões).
- Mapa: react-konva ou PixiJS (fase 3, depois de um teste rápido).
- Desktop: Tauri 2 ou Electron (depende do WebRTC no webview do Tauri).
- Transcrição e LLM: interfaces `Transcriber` e `Summarizer` (fase 4).
