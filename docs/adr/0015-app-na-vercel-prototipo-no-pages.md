# 0015. App com login na Vercel, protótipo no GitHub Pages

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto

O GitHub Pages só serve arquivos estáticos. O app com login precisa de servidor (callback do OAuth, sessão em cookies, Server Actions, token de voz).

## Decisão

- O app real (`/entrar`, `/inicio`, `/criar-cenario`, `/c/...`) fica em `app/(conta)` e roda na Vercel.
- O protótipo com dados de exemplo fica em `/demo` e, junto com o design system e a página inicial, continua publicado no Pages.
- No build do Pages, o workflow remove `app/(conta)`; rotas de API e o `proxy.ts` ficam de fora pelo `pageExtensions` (só `.tsx` vira rota no export estático).
- `NEXT_PUBLIC_AUTH_ENABLED` e `NEXT_PUBLIC_VOICE_ENABLED` são calculados no `next.config.ts`: só ligam com servidor e com as variáveis configuradas.

## Consequências

- O protótipo e o app real convivem até as campanhas reais (fase 1) substituírem a Mesa de exemplo.
- Qualquer rota nova que precise de servidor vai em `app/(conta)` (páginas) ou é um `route.ts`.
