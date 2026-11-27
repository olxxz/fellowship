# Ideias para depois

Anotações para não esquecer. Nada aqui está decidido.

## Voz (e câmera) por proximidade na Mesa

- O volume de cada pessoa depende da distância entre os tokens no mapa da Mesa: perto se ouve bem, longe some
  (como os escritórios virtuais em que você "anda" até alguém para falar).
- O mestre liga numa cena específica e pode separar um jogador do grupo (ele deixa de ouvir os outros e vice-versa).
  Cenas de terror ficam muito melhores.
- Testar também a câmera por proximidade: o vídeo de quem está longe esmaece ou some.
- Base técnica: já temos volume por pessoa no LiveKit (`setVolume`); falta a posição dos tokens em tempo real e uma curva de
  atenuação (ex.: linear até um raio, zero depois). Separar alguém = assinar/desassinar faixas no servidor (permissões por sala).

## Chat

- Divisor "Novas mensagens" na última leitura de cada canal.
- Lista virtualizada para canais com dezenas de milhares de mensagens (só desenha o que está na tela).
- Busca nas mensagens (texto, autor, com anexos, por data).
- Mensagens fixadas no canal.
- Threads (conversa paralela a partir de uma mensagem).

## Canais

- Canal funcional: regras da casa, agenda de sessões com confirmação de presença, enquete de data.
- Voz dinâmica: salas que nascem quando alguém entra e somem quando ficam vazias.

## One-shots, aventuras da comunidade e jogo solo

- Campanha avulsa (one-shot) sem precisar de um Cenário: um Cenário pessoal escondido por baixo, criado na hora.
- Aventura como módulo: cenas, NPCs, mapas, handouts, modelo de ficha e personagens prontos. Quem joga cria uma cópia
  (a campanha) e o original fica intacto. Exportar uma campanha própria como aventura.
- Vitrine de aventuras da comunidade (no Explorar): busca, sistema, duração, nº de jogadores, avaliações; denúncia e
  moderação. Pago só depois, se fizer sentido. Conteúdo de D&D só pelo SRD 5.2 (CC-BY).
- Solo só com código: aventura-livro-jogo (cenas ligadas por escolhas e testes: rolou ≥ CD vai para a cena X) e
  oráculos/tabelas aleatórias para inventar o resto. Tudo determinístico, sem custo por sessão.
- Narrador de IA (depois, opcional): narra dentro da aventura escrita, pede as rolagens e o servidor rola; regras e
  estado continuam no código. Custo por sessão, então provavelmente recurso pago.
- Editor de aventura visual dentro do app (por trás é JSON): cenas como cartões ligados por setas (escolhas e testes),
  painel da cena (texto, imagem, efeitos), validação ao vivo (cena sem saída, cena inalcançável, item que ninguém dá).
  Mapa simples opcional (imagem plana com pontos clicáveis ligados às cenas).

## Atalhos (hotkeys)

- Paleta de comandos (Ctrl/⌘ K): ir para canal, Cenário, campanha, pessoa; rolar dados ("r 1d20+5").
- Alt+↑/↓ canal anterior/próximo; Ctrl+/ lista de atalhos; M mutar; Esc fecha; na Mesa: D dados, F ficha, C chat.
