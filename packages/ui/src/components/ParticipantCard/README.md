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

`color` padrão: 4 (a do Narrador). A fala é anunciada por uma região `role="status"` e mostrada com ícone de onda sonora, não só pela borda.
