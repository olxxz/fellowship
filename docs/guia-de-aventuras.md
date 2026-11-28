# Guia de criação de aventuras

Como escrever aventuras para jogar sozinho no Fellowship, em qualquer gênero: fantasia medieval, terror, ficção científica, faroeste, mistério urbano, cyberpunk, conto de fadas. O guia diz o que costuma funcionar, mas não é uma fôrma. Se uma regra atrapalhar a sua história, quebre-a de propósito e saiba por quê.

A primeira aventura, **O Farol de Vel** (`apps/web/lib/adventures/farol.ts`), foi escrita seguindo este guia. Use-a como exemplo.

---

## 1. O que é uma aventura aqui

Um livro-jogo: cenas ligadas por escolhas. Algumas escolhas são **testes**: o jogador rola 1d20, soma um atributo e precisa alcançar uma dificuldade (CD). Itens e marcações abrem ou fecham caminhos. A vida pode acabar.

Por trás é um JSON (o formato está na seção 8), e o editor visual vai ler e escrever esse mesmo formato. O **validador** (`validateAdventure`, em `packages/core`) roda nos testes e acusa os furos mecânicos: cena que não existe, cena que ninguém alcança, beco sem saída, item que ninguém dá.

Avisar sobre contradições de *história* é trabalho seu, ou da IA que escreve com você. Veja a seção 6.

---

## 2. Antes de escrever: a semente

Responda em poucas linhas, nesta ordem. Cada resposta cabe numa frase.

1. **O lugar.** Onde é, e o que tem de estranho nele? ("Um vilarejo de pescadores cujo farol apagou.")
2. **O problema.** O que está errado *agora*, que não pode esperar? ("A névoa não sai da baía e os barcos batem nas pedras.")
3. **O segredo.** O que está por trás, que o jogador vai descobrindo? ("Um sino afundado chama quem está perto quando o farol apaga.")
4. **A pessoa.** Quem está em perigo ou no caminho? Dê nome, idade e um gesto. ("Ilda, a faroleira, de cabelos brancos, que canta para o mar.")
5. **A chave.** O que resolve de verdade, e onde está? ("O sino do farol tem que responder; o badalo caiu nas pedras.")
6. **O preço.** O que dá para salvar pela metade? (Salvar a Ilda sem calar o sino.)

Se você tem essas seis linhas, você tem uma aventura.

> Em *Terramar*, Ursula K. Le Guin faz o mundo parecer enorme com poucos detalhes certeiros, sem explicar tudo. Faça o mesmo: escolha um ou dois detalhes muito específicos, como uma tranca de madeira por dentro ou um badalo com o elo partido, e deixe o jogador ligar os pontos.

---

## 3. A lista de fatos (a âncora da coerência)

No topo do arquivo, antes das cenas, escreva os **fatos** da história em tópicos curtos. É a verdade do seu mundo. Toda cena nova é conferida contra ela.

O que entra na lista:
- **Linha do tempo:** o que aconteceu antes e em que ordem.
- **Onde cada objeto importante está**, e por quê.
- **O que cada personagem sabe, e o que não sabe.**
- **As regras do sobrenatural, da tecnologia ou da magia:** o que pode, o que não pode e o que custa.
- **O que o jogador decide**, para nada ser decidido por ele.

Exemplo do Farol: "a lâmpada é a óleo e o óleo do farol estava no fim, então só acende com a lanterna de Bento". Por causa desse fato, a escolha de acender a lâmpada só aparece para quem aceitou a lanterna.

---

## 4. A estrutura

### Tamanho

Comece pequeno: de 15 a 25 cenas dão de 15 a 25 minutos. Uma aventura curta e redonda vale mais que uma longa com pontas soltas.

### Forma

Pense num **diamante**, não numa árvore infinita: abre, aperta, abre de novo e fecha. Os caminhos se separam e se reencontram em **cenas-gargalo** (no Farol: a porta da torre, a escada, a sala da lâmpada). Isso deixa a escolha importante sem multiplicar o trabalho.

### Os três movimentos

1. **O chamado:** o mundo normal com uma rachadura. Termina quando o jogador decide ir.
2. **A travessia:** obstáculos, descobertas, itens. Cada caminho ensina alguma coisa sobre o segredo.
3. **O confronto:** o lugar onde a chave encontra o problema. Os finais nascem daqui.

### Finais

Tenha pelo menos três:
- **Vitória:** usou a chave.
- **Parcial:** salvou algo, mas o problema continua.
- **Derrota:** a vida acabou ou o jogador desistiu.

A derrota não precisa ser morte. No Farol, você acorda no cais e o farol continua apagado. Para o jogador querer jogar de novo, o final parcial deve **apontar** o que faltou ("O sino do farol tem que responder", diz a Ilda).

> Em *O jardim de veredas que se bifurcam*, Borges imagina um livro em que todos os caminhos acontecem. A árvore de escolhas do app é isso: o jogador vê os galhos que ainda não tomou. Escreva finais que façam ele querer abrir os outros.

---

## 5. As escolhas

### Regra de ouro: não decida pelo jogador

Enquanto houver escolha possível, ela é do jogador. Pegar um item, abrir uma porta, ler um diário, entrar, voltar, desistir: tudo é uma escolha. Se a cena descreve a ação do personagem, pergunte se ela devia ser um botão.

- ❌ "Você acha a portinhola e desce."
- ✅ "Você acha a portinhola." Escolhas: "Abrir e descer" ou "Voltar para a porta da frente".

### Boas escolhas

- **Têm consequência visível.** Algo muda: um item, uma informação, um caminho, a vida.
- **São diferentes entre si.** Nada de "ir pela esquerda" e "ir pela direita" sem diferença. Cada opção deve mostrar um jeito de ser: arriscar ou ir com cuidado, falar ou agir, ajudar ou seguir em frente.
- **São legíveis.** O texto do botão diz o que o personagem faz, no infinitivo, com o objeto ("Pegar o badalo e subir a escada").
- **Sempre há uma saída sem condição.** Se todas as escolhas de uma cena pedem item ou marcação, o jogador pode ficar preso (o validador avisa).

### Testes (o d20)

- O jogador vê o atributo e a CD antes de escolher.
- **Dificuldades de referência** (chance com um atributo de +1):

  | CD | Dificuldade | Chance |
  | --- | --- | --- |
  | 8 | fácil | 70% |
  | 11 | média | 55% |
  | 14 | difícil | 40% |
  | 17 | heroica | 25% |

  Cada +1 no atributo soma 5% de chance.

- **Falhar faz a história andar.** A falha leva a outra cena, custa vida ou fecha um caminho, mas não para tudo. No Farol, falhar o pulo deixa você ralado do outro lado do vão; você não morre.
- Se a mesma tentativa puder se repetir, que custe alguma coisa a cada vez (vida) e que haja uma alternativa por perto, para o jogador não ficar preso num loop.

### Itens e marcações

- **Item** é uma chave física ("Badalo de bronze"). **Marcação** é algo que aconteceu ("leu o diário", "chamou a Ilda").
- Use poucos: de 2 a 4 itens por aventura. Cada um deve abrir algo concreto.
- Siga a regra da arma de Tchekhov: se um objeto aparece com destaque, ele tem uso. Se não tem, tire o destaque.

---

## 6. A escrita

### Os sentidos (a imersão)

Cada cena deve ter pelo menos **três sentidos**, e não só a visão:
- **Cheiro:** sal, óleo rançoso, ozônio, cera queimada, sangue, terra molhada.
- **Som:** o que se ouve longe e o que se ouve perto.
- **Tato e temperatura:** corrimão molhado, vento que empurra, metal frio.
- **Sentimento no corpo:** o medo no estômago, o som nos dentes.

> Ray Bradbury escrevia com todos os sentidos. Em *A sirene de nevoeiro* (*The Fog Horn*), um farol chama do fundo do mar uma criatura solitária. O Farol de Vel é parente desse conto, e vale a leitura.

### Mostrar o estranho pelo ordinário

O assombro funciona melhor quando nasce de algo comum que está *errado*: gaivotas quietas, pegadas molhadas de pés descalços, um sino sem badalo.

> Stephen King e Shirley Jackson (*A assombração da casa da colina*) constroem o medo com detalhes domésticos fora do lugar. Lovecraft faz o contrário: dá nome ao indescritível ("um som afogado, impossível") e deixa o jogador imaginar o resto. Use os dois.

### Ritmo

- Parágrafos de duas a quatro frases. Frases curtas na tensão, longas na contemplação.
- Cena de calma: mais descrição. Cena de perigo: menos descrição e mais urgência.
- Termine a cena num gancho, algo que pede uma escolha ("Ilda dá um passo à frente.").

### O que deixar de fora

> Hemingway falava do iceberg: o que você sabe e não escreve dá peso ao que escreve.

Não explique o segredo inteiro. Deixe uma pergunta sem resposta no fim; é ela que fica na cabeça.

### Personagens

Cada um aparece com **um gesto e uma frase**: Bento cospe no mar antes de responder; Ilda canta de olhos abertos. Dê a cada um um jeito próprio de falar.

### Contradições: a revisão a cada cena

Depois de escrever cada cena, confira:
1. **Bate com a lista de fatos?** Se a cena criou um fato novo, ele vai para a lista.
2. **O personagem sabe o que está dizendo?** Ninguém conhece o que não viu.
3. **A cena funciona vinda de todos os caminhos que chegam a ela?** No Farol, a sala da lâmpada recebe quem acordou a Ilda e quem não acordou; o texto serve para os dois.
4. **Algum objeto apareceu ou sumiu do nada?**
5. **O jogador foi forçado a algo que podia escolher?**

Na primeira versão do Farol, essa revisão pegou que Bento dizia que a Ilda tinha comprado óleo na semana anterior e, na mesma fala, que o óleo tinha acabado.

---

## 7. Gêneros: o mesmo esqueleto, roupas diferentes

As seis linhas da semente (seção 2) servem para qualquer gênero. O que muda é a paleta.

| Gênero | Sensação | Detalhe que funciona | O "segredo" costuma ser | Para ler |
| --- | --- | --- | --- | --- |
| Fantasia medieval | maravilha, peso da história | ruínas com nomes antigos, magia com custo | uma promessa ou um pacto antigo | Le Guin (*Terramar*), Tolkien, Steve Jackson e Ian Livingstone (*Fighting Fantasy*, *Sorcery!*) |
| Terror | pavor que cresce devagar | o ordinário fora do lugar, silêncio | algo que quer entrar ou que já está dentro | Shirley Jackson, Lovecraft, Robert Aickman, Stephen King |
| Ficção científica | escala, solidão, deslumbre | tecnologia com desgaste, regras físicas claras | uma decisão humana por trás da máquina | Le Guin (*A mão esquerda da escuridão*), Asimov, Ted Chiang |
| Cyberpunk | pressa, néon, dívida | marcas, implantes, chuva ácida, gíria | quem lucra com o problema | William Gibson (*Neuromancer*), Philip K. Dick |
| Mistério | curiosidade, desconfiança | pistas pequenas, álibis, horários | quem mente e por quê | Agatha Christie, Edgar Allan Poe (*Os crimes da Rua Morgue*) |
| Faroeste | poeira, honra, distância | sol, sede, armas que falham | uma injustiça antiga | Cormac McCarthy, Elmore Leonard |
| Conto de fadas | encanto com regras cruéis | três tentativas, promessas literais | uma regra que o herói precisa cumprir | Neil Gaiman (*Stardust*), Italo Calvino (*Fábulas italianas*) |
| Humor | leveza, absurdo coerente | burocracia mágica, consequências ridículas | alguém levou algo a sério demais | Terry Pratchett (*Discworld*), Douglas Adams |

Misturas funcionam muito bem: terror no espaço, mistério numa cidade mágica, faroeste com dragões. Só mantenha **uma** regra de mundo clara, para o jogador poder raciocinar.

> Italo Calvino, em *As cidades invisíveis*, descreve cada lugar por um único traço impossível. Bom exercício para abrir uma aventura: qual é o traço impossível deste lugar?

---

## 8. O formato (referência)

```ts
{
  id: "farol-de-vel",            // único, minúsculas e hífens
  titulo: "O Farol de Vel",
  resumo: "Uma ou duas frases que dão vontade de jogar.",
  autor: "Quem escreveu",
  duracao: 20,                    // minutos, mais ou menos
  genero: "Mistério",
  sigla: "FV", cor: "#3d5a73",    // ícone na barra de Cenários
  inicio: "cais",                 // cena inicial
  derrota: "nevoa",               // para onde vai quem zera a vida
  vida: 10,
  stats: [{ key: "agilidade", nome: "Agilidade", valor: 2 }],   // bônus no d20
  itens: { badalo: "Badalo de bronze" },                        // chave → nome
  cenas: {
    cais: {
      titulo: "O cais",
      texto: "Parágrafo.\n\nOutro parágrafo.",
      arte: "ASCII opcional",          // ou imagem: "https://..."
      efeitos: [{ item: "lanterna" }, { flag: "diario" }, { vida: -2 }, { tirarItem: "x" }],
      escolhas: [
        { texto: "Ir à trilha", ir: "trilha" },
        { texto: "Pular o vão", teste: { stat: "agilidade", cd: 12, sucesso: "porta", falha: "queda", efeitosFalha: [{ vida: -3 }] } },
        { texto: "Usar o badalo", ir: "resposta", precisa: { item: "badalo" } },   // também: flag, semFlag, semItem
      ],
    },
    resposta: { titulo: "A resposta", texto: "…", fim: "vitoria" },   // "vitoria" | "parcial" | "derrota"
  },
}
```

### Arte

- **ASCII:** até uns 32 caracteres de largura, para caber no celular. Poucos traços valem mais que muitos. Bom para mapas, símbolos e silhuetas.
- **Imagem:** uma por cena no máximo, e só onde ela muda a cena. A imaginação do leitor é o melhor ilustrador.

---

## 9. Passo a passo (com a IA ou sozinho)

1. Escreva a **semente** (seção 2) e a **lista de fatos** (seção 3).
2. Desenhe o **mapa das cenas** em texto: só os títulos e as setas. Marque os gargalos e os finais.
3. Escreva as cenas na ordem do caminho principal. Depois escreva as alternativas.
4. Revise **cada cena** com as cinco perguntas da seção 6.
5. Rode o **validador** (`pnpm --filter web test`); ele lista os furos mecânicos.
6. **Jogue todos os finais.** Jogue de novo escolhendo sempre o oposto do que escolheria.
7. Corte de 10% a 20% do texto. Toda aventura melhora quando fica mais enxuta.
8. Registre a aventura em `apps/web/lib/adventures/index.ts`.

### Para pedir uma aventura à IA

Passe as seis linhas da semente, o gênero, o tamanho (número de cenas) e estas regras:
- "Mantenha uma lista de fatos no topo e confira cada cena contra ela."
- "Não decida pelo jogador; toda ação é uma escolha."
- "Use pelo menos três sentidos por cena."
- "Três finais: vitória, parcial (que aponte o que faltou) e derrota."
- "Falhar faz a história andar."

---

## 10. Checklist final

- [ ] A semente cabe em seis linhas.
- [ ] A lista de fatos está no topo e cada cena bate com ela.
- [ ] Nenhuma ação do personagem foi decidida pelo texto.
- [ ] Toda cena tem saída, e pelo menos uma escolha sem condição.
- [ ] Cada item tem um uso, e cada uso tem um item obtenível.
- [ ] Os testes mostram atributo e CD, e a falha leva a algum lugar.
- [ ] Há vitória, parcial e derrota, e o parcial aponta o que faltou.
- [ ] Três sentidos por cena; um gesto e uma voz por personagem.
- [ ] O validador passa.
- [ ] Todos os finais foram jogados.

---

## Leituras que inspiram este guia

- **Livros-jogo:** Edward Packard (*Escolha sua aventura*), Steve Jackson e Ian Livingstone (*Fighting Fantasy*, *Sorcery!*), Joe Dever (*Lobo Solitário*).
- **Sobre escrever:** Ursula K. Le Guin (*Steering the Craft*), Stephen King (*Sobre a escrita*), Ray Bradbury (*O zen e a arte da escrita*).
- **Para o ouvido e o assombro:** Ray Bradbury (*A sirene de nevoeiro*), Shirley Jackson, H. P. Lovecraft, Jorge Luis Borges (*Ficções*), Italo Calvino (*As cidades invisíveis*).
- **Jogos de narrativa ramificada:** *Detroit: Become Human* (o fluxograma de escolhas), *80 Days* e *Sorcery!* da Inkle, *Disco Elysium* (testes que fazem a história andar).
