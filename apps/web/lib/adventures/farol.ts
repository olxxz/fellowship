import type { Adventure } from "@fellowship/core";

// "O Farol de Vel": aventura solo curta (uns 15 minutos), só texto. Fatos da história, para as cenas não se
// contradizerem:
// - Ilda, a faroleira, não acende o farol há duas noites. Desde então a névoa não sai da baía e um barco já bateu.
// - Há um sino afundado na baía, de um naufrágio antigo. Com o farol apagado, ele "chama" quem está perto.
// - Ilda tentou responder tocando o sino do farol; o badalo, já gasto, se soltou e caiu pela janela nas pedras.
// - Depois disso ela trancou a porta por dentro (com a tranca de madeira) e subiu; está em transe no alto da torre.
// - O sino só se cala se o sino do farol responder (com o badalo); acender a lâmpada afasta a névoa, mas não cala o sino.
// - A lâmpada é a óleo e o óleo do farol acabou (Ilda ia comprar mais com Bento): para acender, só com a lanterna que Bento empresta.
// - O porão tem uma portinhola externa, do lado do mar, que só se acha com luz.
export const farol: Adventure = {
  id: "farol-de-vel",
  titulo: "O Farol de Vel",
  resumo: "Há duas noites o farol de Vel não acende e a névoa não sai da baía. Suba a torre e descubra o que aconteceu com Ilda, a faroleira.",
  autor: "Fellowship",
  duracao: 15,
  genero: "Mistério",
  inicio: "cais",
  derrota: "nevoa",
  vida: 10,
  stats: [
    { key: "forca", nome: "Força", valor: 1 },
    { key: "agilidade", nome: "Agilidade", valor: 2 },
    { key: "mente", nome: "Mente", valor: 1 },
    { key: "presenca", nome: "Presença", valor: 0 },
  ],
  itens: {
    lanterna: "Lanterna com óleo",
    badalo: "Badalo de bronze",
  },
  cenas: {
    cais: {
      titulo: "O cais",
      texto:
        "O sol se põe sobre Vel e a névoa já engoliu metade da baía. No alto do penhasco, o farol está escuro pela segunda noite seguida.\n\nBento, o pescador mais velho do cais, amarra o barco com as mãos tremendo. \"Ontem o barco do Tico bateu nas pedras. Sem luz, ninguém volta\", ele diz, olhando para a torre.",
      escolhas: [
        { texto: "Perguntar a Bento sobre a faroleira", ir: "bento" },
        { texto: "Subir direto a trilha do farol", ir: "trilha" },
      ],
    },
    bento: {
      titulo: "O que Bento sabe",
      texto:
        "\"A Ilda cuida do farol há trinta anos\", diz Bento. \"Semana passada ela me contou que ouvia um sino tocando debaixo d'água. Achei que era cansaço.\"\n\nEle tira do barco uma lanterna de latão, cheia de óleo. \"Leva. O óleo do farol estava no fim, ela ia buscar mais comigo. E toma cuidado: ela anda trancando a porta por dentro.\"",
      efeitos: [{ item: "lanterna" }],
      escolhas: [{ texto: "Agradecer e subir a trilha", ir: "trilha" }],
    },
    trilha: {
      titulo: "A trilha do penhasco",
      texto:
        "A trilha sobe colada ao penhasco. Na metade, um pedaço desabou: um vão de quase dois metros sobre as pedras e a espuma lá embaixo.\n\nDe longe, por baixo do barulho das ondas, você ouve um som grave e lento, como um sino tocando dentro d'água.",
      escolhas: [
        { texto: "Pular o vão", teste: { stat: "agilidade", cd: 12, sucesso: "porta", falha: "queda", efeitosFalha: [{ vida: -3 }] } },
        { texto: "Descer pelas pedras e contornar por baixo", ir: "pedras" },
      ],
    },
    queda: {
      titulo: "Por pouco",
      texto: "Seu pé escorrega na borda. Você se agarra numa raiz e se arrasta para cima, ralado e sem fôlego, mas do outro lado do vão.",
      escolhas: [{ texto: "Seguir até o farol", ir: "porta" }],
    },
    pedras: {
      titulo: "As pedras da maré",
      texto:
        "Você desce até as pedras molhadas ao pé da torre. Entre as algas, algo brilha: um badalo de bronze, grande como um braço, com um elo partido na ponta. Ele caiu lá de cima.\n\nVocê o prende no cinto e sobe pela escada de ferro presa à rocha, que leva à porta do farol.",
      efeitos: [{ item: "badalo" }],
      escolhas: [{ texto: "Ir até a porta", ir: "porta" }],
    },
    porta: {
      titulo: "A porta do farol",
      texto:
        "A porta de carvalho não abre: está trancada por dentro, do jeito que Bento disse que a Ilda vinha fazendo. A janela do térreo, mais acima, está entreaberta.\n\nDe dentro da torre, uma voz canta baixinho, no ritmo do sino debaixo d'água.",
      escolhas: [
        { texto: "Forçar a porta com o ombro", teste: { stat: "forca", cd: 14, sucesso: "terreo", falha: "porta-falha", efeitosFalha: [{ vida: -2 }] } },
        { texto: "Escalar até a janela", teste: { stat: "agilidade", cd: 11, sucesso: "terreo", falha: "porta-falha", efeitosFalha: [{ vida: -2 }] } },
        { texto: "Rodear a torre com a lanterna acesa, procurando outra entrada", ir: "porao", precisa: { item: "lanterna" } },
      ],
    },
    "porta-falha": {
      titulo: "A torre resiste",
      texto: "Você bate contra a pedra e a madeira e sente o ombro doer. Respira fundo. A janela entreaberta continua lá, um pouco mais alta do que parecia.",
      escolhas: [{ texto: "Tentar a janela com calma", teste: { stat: "agilidade", cd: 9, sucesso: "terreo", falha: "porta-falha", efeitosFalha: [{ vida: -2 }] } }],
    },
    porao: {
      titulo: "A portinhola do porão",
      texto:
        "Do lado do mar, a luz da lanterna mostra uma portinhola de madeira no chão, meio coberta de sal. Ela leva ao porão, onde ficam os barris vazios de óleo.\n\nNuma prateleira há um caderno com capa de couro: o diário da Ilda. A última página diz: \"O sino da baía chama quando a luz apaga. O sino do farol tem que responder. Tentei tocar e o badalo velho se partiu e caiu nas pedras.\"",
      efeitos: [{ flag: "diario" }],
      escolhas: [{ texto: "Subir a escada do porão", ir: "escada" }],
    },
    terreo: {
      titulo: "O térreo",
      texto:
        "Dentro, a mesa está virada e a tranca de madeira atravessa a porta: foi a própria Ilda quem se trancou. Pegadas molhadas sobem a escada em espiral.\n\nNo chão, folhas soltas de um diário. Numa delas: \"O sino do farol tem que responder. O badalo se partiu e caiu nas pedras.\"",
      efeitos: [{ flag: "diario" }],
      escolhas: [{ texto: "Subir a escada", ir: "escada" }],
    },
    escada: {
      titulo: "A escada em espiral",
      texto: "São cento e doze degraus. A cada volta, a canção fica mais alta e o som do sino debaixo d'água parece vir de dentro das paredes.",
      escolhas: [
        { texto: "Subir em silêncio", ir: "topo" },
        { texto: "Chamar a Ilda pelo nome", ir: "topo", efeitos: [{ flag: "chamou" }] },
      ],
    },
    topo: {
      titulo: "A sala da lâmpada",
      texto:
        "No alto, a grande lâmpada está apagada e seca. Ilda, de cabelos brancos e camisola molhada, está de pé na janela, olhando o mar e cantando. Ao lado dela, o sino do farol pende sem badalo.\n\nLá embaixo, a névoa cobre a baía inteira. O sino afundado toca de novo, e Ilda dá um passo em direção à janela.",
      escolhas: [
        { texto: "Prender o badalo no sino e tocar", ir: "resposta", precisa: { item: "badalo" } },
        { texto: "Encher a lâmpada com o óleo da lanterna e acender", ir: "acesa", precisa: { item: "lanterna" } },
        { texto: "Segurar a Ilda e chamá-la de volta", teste: { stat: "presenca", cd: 13, sucesso: "acorda", falha: "luta" } },
      ],
    },
    luta: {
      titulo: "O transe",
      texto: "Ilda não reconhece você. Ela se debate com uma força que não parece dela, os olhos fixos no mar.",
      escolhas: [{ texto: "Segurá-la longe da janela", teste: { stat: "forca", cd: 12, sucesso: "acorda", falha: "acorda", efeitosFalha: [{ vida: -4 }] } }],
    },
    acorda: {
      titulo: "Ilda volta",
      texto:
        "Ilda pisca, como quem sai de um sonho, e cai sentada no chão. \"O sino da baía... ele chama quando a luz apaga. Eu tentei responder, mas o badalo se partiu e caiu nas pedras\", ela diz, apontando o sino vazio.",
      escolhas: [
        { texto: "Mostrar o badalo que você achou e tocar o sino", ir: "resposta", precisa: { item: "badalo" } },
        { texto: "Acender a lâmpada com o óleo da lanterna", ir: "acesa", precisa: { item: "lanterna" } },
        { texto: "Levar a Ilda para baixo, em segurança", ir: "parcial" },
      ],
    },
    acesa: {
      titulo: "Luz",
      texto:
        "A chama pega, a lâmpada gira e o facho corta a névoa. Lá embaixo, no cais, alguém grita de alegria.\n\nMas o sino afundado não para. Ele toca mais forte, quase com raiva, e a névoa volta a se fechar devagar onde a luz não alcança.",
      escolhas: [
        { texto: "Prender o badalo no sino e responder", ir: "resposta", precisa: { item: "badalo" } },
        { texto: "Manter o farol aceso até o amanhecer", ir: "parcial" },
      ],
    },
    resposta: {
      titulo: "A resposta",
      texto:
        "Você encaixa o badalo de bronze e puxa a corda. O sino do farol toca, claro e alto, por cima da baía.\n\nDebaixo d'água, o outro sino responde uma vez, mais fraco. E se cala. A névoa começa a se desfazer como fumaça, e as luzes dos barcos aparecem uma a uma no escuro.",
      fim: "vitoria",
    },
    parcial: {
      titulo: "Até a próxima noite",
      texto:
        "Ilda está a salvo, enrolada num cobertor no cais, e os pescadores agradecem. Mas o sino da baía continua tocando, baixinho, e a névoa não foi embora.\n\n\"O sino do farol tem que responder\", Ilda repete. Alguém vai precisar voltar lá.",
      fim: "parcial",
    },
    nevoa: {
      titulo: "A névoa",
      texto: "Os ferimentos pesam e tudo fica branco. Quando você acorda, está no cais, com Bento ao seu lado. O farol continua apagado.",
      fim: "derrota",
    },
  },
};
