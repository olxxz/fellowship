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
