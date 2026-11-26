# 0013. Token de voz sem login até o Supabase

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto

O teste do LiveKit (fase 0) precisa de voz funcionando antes do login. O token de entrada na sala só pode ser gerado no servidor, porque usa o segredo do LiveKit.

## Decisão

- A rota `POST /api/livekit/token` gera o token com `livekit-server-sdk`, no servidor (Vercel).
- Sem login, quem usa escolhe um dos usuários do grupo ("Você é", no painel do usuário). A escolha fica no navegador.
- O servidor só aceita salas de campanhas com sessão ao vivo e usuários conhecidos. O token vale 2 horas, para uma sala, sem `canPublishData`.
- O identity tem um sufixo aleatório (a mesma pessoa em duas abas não derruba a outra conexão); o usuário vai no atributo `userId`, que a Mesa usa para achar o card.
- O build estático do GitHub Pages não inclui rotas de API (`pageExtensions`), e a Mesa de lá funciona sem voz.

## Consequências

- Qualquer pessoa com o link do deploy da Vercel pode entrar na sala como um dos usuários. Aceitável no estágio 1 (um grupo, link não divulgado), não depois.
- Quando o Supabase entrar, a rota passa a exigir sessão: o usuário vem do login e o papel (mestre, jogador, espectador) da campanha, checado no servidor.
- Chat e rolagens continuam locais em cada navegador até o Supabase Realtime: só a voz é compartilhada.
