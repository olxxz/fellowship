# Button

Botão de ação com quatro variantes: principal (`accent`), secundário (`bg-raised`), Mesa (`mesa-gold`) e perigo (`danger`).

- **Principal:** uma por tela, para a ação que conclui a tarefa ("Salvar alterações", "Aceitar convite").
- **Secundário:** ações de apoio ("Convidar", "Buscar", "Descartar").
- **Mesa:** tudo o que é jogo: rolar dados, entrar na Mesa, pedir teste. Texto em `mesa-ink`.
- **Perigo:** sair da sala, apagar. Nunca como ação principal de uma tela comum.
- Altura mínima `size-touch` (44px), raio `radius-md`, texto `label` ou `body-sm` em 600.
- Ícone opcional à esquerda, 18px. Botão só de ícone: redondo (`radius-full`) com `aria-label`.
- Foco: anel de 2px em `focus-ring`. Desabilitado: `text-faint` e opacidade 0.6, nunca só cinza.
- Carregando: um indicador girando entra no lugar do ícone, com um texto do que está acontecendo (`loadingLabel`, ex.: "Criando…"). O espaço do texto fica reservado, então o botão não muda de largura. Com "reduzir movimento", o indicador só pulsa.

## No código

```tsx
<Button variant="primary">Salvar alterações</Button>
<Button variant="mesa" icon="dice">Rolar 1d20 + 4</Button>
<Button variant="danger" icon="leave">Sair</Button>
<Button variant="primary" loading={pending} loadingLabel="Criando…">Criar Cenário</Button>
<Button variant="mesa" icon="dice" iconKey={rolagens} iconMotion="tumble">Rolar</Button>
<IconButton icon="micOff" label="Desmutar" />
<Button.Skeleton width={120} />
```

`variant` padrão: `secondary`. Com `loading`, o botão marca `aria-busy`, ignora o clique e mantém a largura; o nome para leitores de tela continua sendo o rótulo.

**Ícones animados** (`Icon motion`): `spin` (carregando), `tumble` (dado rolando, uma volta; mude `iconKey` para repetir), `pop` (confirmação, ex.: "Copiado"), `pulse` e `wave` (onda de quem fala). Só onde o movimento comunica algo, e tudo para com "reduzir movimento".
