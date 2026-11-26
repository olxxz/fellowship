# ParticipantCard

Card de cada participante na Mesa: retrato do personagem grande, avatar do jogador pequeno no canto, nome e status.

- **Falando:** borda de 3px na cor do personagem (`--player-color`, um dos `player-*`) e status "falando" na mesma cor. Também anuncia "Kael está falando" para leitores de tela.
- **Em silêncio:** borda em `border`.
- **Com câmera:** o retrato vira o vídeo, e o retrato do personagem passa para o canto no lugar do avatar.
- **Mutado:** ícone de microfone riscado em `danger-soft`, além do status.
- Retrato com proporção fixa; sem imagem, a inicial em `number-xl` na cor do personagem.
- Raio `radius-xl`, padding `space-3`. O Narrador usa `player-4` por padrão.

## No código

```tsx
<ParticipantCard characterName="Kael" playerName="Ana" color={1} speaking />
<ParticipantCard characterName="Lia" playerName="Carla" color={3} muted />
<ParticipantCard characterName="Brom" playerName="Bruno" color={2} video={<video … />} />
<ParticipantCard.Skeleton />
```

**Só o retrato** (`variant="portrait"`): o card vira só o palco, para grades densas e o celular. A borda continua acendendo na cor do personagem, e o status aparece num selo no canto superior esquerdo (onda sonora ao falar, microfone riscado quando mutado). O nome não aparece na tela: fica no rótulo acessível e na dica ao passar o mouse.

```tsx
<ParticipantCard variant="portrait" characterName="Kael" playerName="Ana" color={1} speaking />
<ParticipantCard.Skeleton variant="portrait" />
```

`color` padrão: 4 (a do Narrador). A fala é anunciada por uma região `role="status"` e mostrada com ícone de onda sonora, não só pela borda.
