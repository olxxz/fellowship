import type { Adventure } from "@fellowship/core";

// "O Farol de Vel": aventura solo curta (uns 20 minutos). Fatos da história, para as cenas não se contradizerem:
// - Ilda, a faroleira, não acende o farol há duas noites. Desde então a névoa não sai da baía e um barco (o do Tico) bateu.
// - Há cem anos o navio Santa Ifigênia afundou na baía levando o sino de uma igreja. Com o farol apagado, esse sino
//   "toca" debaixo d'água e chama quem está perto do mar.
// - Ilda tentou responder tocando o sino do farol; o badalo, velho, se partiu e caiu pela janela nas pedras ao pé da torre.
// - Depois disso ela trancou a porta por dentro (tranca de madeira) e subiu; está em transe no alto da torre.
// - O sino afundado só se cala se o sino do farol responder (com o badalo). Acender a lâmpada afasta a névoa, mas não o cala.
// - A lâmpada é a óleo e o óleo do farol estava no fim (Ilda ia comprar mais com Bento): só acende com a lanterna de Bento.
// - O porão tem uma portinhola do lado do mar, coberta de sal, que só se acha com luz.
// - O jogador decide tudo o que faz: pegar ou não os itens, entrar ou não, ler ou não.

const SINO_DISTANTE =
  "E então você ouve. Vem de longe, de baixo, de dentro do mar: uma badalada afogada, lenta, cheia de sal e de fundura, como se o próprio oceano tivesse aprendido a tocar um sino. Não é nenhum som que você conheça. É impossível. E ainda assim o seu peito responde a ele, como se uma maré subisse por dentro e trouxesse junto um medo antigo, mais velho que você.";

export const farol: Adventure = {
  id: "farol-de-vel",
  titulo: "O Farol de Vel",
  resumo: "Há duas noites o farol de Vel não acende, a névoa não sai da baía e, debaixo d'água, um sino que ninguém vê começou a tocar.",
  autor: "Fellowship",
  duracao: 20,
  genero: "Mistério",
  sigla: "FV",
  cor: "#3d5a73",
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
      arte: [
        "          /\\",
        "         /__\\",
        "         |[]|      ~  ~",
        "         |  |   ~       ~",
        "        /|  |\\",
        " ~~~~~~~/____\\~~~~~~~~~~~~~",
        "  ~~ ~~~ ~~ ~~~~ ~~~ ~~ ~~~",
      ].join("\n"),
      texto:
        "O sol afunda atrás das casas de Vel e leva o calor junto. O cais cheira a sal, a corda molhada e a peixe esquecido no sol. A névoa já engoliu metade da baía: os barcos ancorados lá fora são só sombras, e as gaivotas, que deviam estar gritando, estão quietas nos telhados.\n\nNo alto do penhasco, o farol está escuro pela segunda noite seguida. Parece um dente morto contra o céu.\n\n" +
        SINO_DISTANTE +
        "\n\nAo seu lado, Bento, o pescador mais velho do cais, para de amarrar o barco. As mãos dele tremem. \"Você também ouviu\", ele diz, sem perguntar.",
      escolhas: [
        { texto: "Perguntar a Bento o que está acontecendo", ir: "bento" },
        { texto: "Não perder tempo e subir a trilha do farol", ir: "trilha" },
      ],
    },
    bento: {
      titulo: "O que Bento sabe",
      texto:
        "Bento cospe no mar, como quem afasta azar. \"A Ilda cuida daquele farol há trinta anos. Nunca deixou apagar, nem com tempestade. Semana passada ela me contou que ouvia um sino tocando debaixo d'água. Eu ri. Ontem o barco do Tico bateu nas pedras, no escuro. Hoje ninguém ri.\"\n\nEle tira do fundo do barco uma lanterna de latão, já cheia de óleo, e a estende para você. \"O óleo do farol estava no fim, ela ia buscar mais comigo. Se você vai subir, leva isso. E cuidado: ela anda trancando a porta por dentro.\"",
      escolhas: [
        { texto: "Perguntar sobre o sino debaixo d'água", ir: "bento-sino" },
        { texto: "Aceitar a lanterna e subir a trilha", ir: "trilha", efeitos: [{ item: "lanterna" }] },
        { texto: "Recusar a lanterna e subir a trilha", ir: "trilha" },
      ],
    },
    "bento-sino": {
      titulo: "O Santa Ifigênia",
      texto:
        "Bento olha para a névoa por um tempo antes de responder. \"Meu avô contava do Santa Ifigênia. Um navio que afundou aqui na baía, faz uns cem anos, levando o sino de uma igreja nova lá do sul. Dizem que o sino nunca parou de tocar lá embaixo. Que só se cala quando o farol está aceso.\"\n\nEle ri, mas é um riso curto, sem vontade. \"Coisa de velho. Mas o farol apagou, e agora a gente escuta.\" A lanterna continua na mão estendida dele.",
      escolhas: [
        { texto: "Aceitar a lanterna e subir a trilha", ir: "trilha", efeitos: [{ item: "lanterna" }] },
        { texto: "Recusar a lanterna e subir a trilha", ir: "trilha" },
      ],
    },
    trilha: {
      titulo: "A trilha do penhasco",
      texto:
        "A trilha sobe colada à rocha, estreita, úmida, com o vento empurrando você contra a pedra e depois puxando, como se não decidisse o que quer. Lá embaixo, o mar quebra branco e o barulho sobe pelas suas pernas.\n\nNa metade do caminho, um pedaço da trilha desabou. Sobrou um vão de quase dois metros, e no fundo dele, as pedras e a espuma.\n\nA badalada vem de novo, mais perto agora. Você sente o som nos dentes.",
      escolhas: [
        { texto: "Tomar distância e pular o vão", teste: { stat: "agilidade", cd: 12, sucesso: "porta", falha: "queda", efeitosFalha: [{ vida: -3 }] } },
        { texto: "Descer pelas pedras e contornar por baixo", ir: "pedras" },
      ],
    },
    queda: {
      titulo: "Por pouco",
      texto:
        "Seu pé acerta a borda, mas a borda não fica. A pedra se desfaz debaixo da bota e você cai de frente contra a rocha. Uma raiz. Seus dedos se fecham nela por instinto.\n\nVocê se arrasta para cima com o joelho sangrando e o coração batendo nos ouvidos, do outro lado do vão. Fica um momento deitado, respirando sal.",
      escolhas: [{ texto: "Levantar e seguir até o farol", ir: "porta" }],
    },
    pedras: {
      titulo: "As pedras da maré",
      texto:
        "Você desce de costas, agarrado na pedra, até as poças que a maré deixou ao pé da torre. Aqui embaixo o ar é mais frio e o cheiro de alga é tão forte que dá para sentir o gosto.\n\nEntre as algas, algo brilha fosco: um badalo de bronze, grande como um braço, verde de tempo, com um elo partido na ponta. Ele não foi trazido pelo mar. Caiu lá de cima.\n\nUma escada de ferro, presa à rocha com pinos enferrujados, sobe até a porta do farol.",
      escolhas: [
        { texto: "Pegar o badalo e subir a escada de ferro", ir: "porta", efeitos: [{ item: "badalo" }] },
        { texto: "Deixar o badalo onde está e subir a escada", ir: "porta" },
      ],
    },
    porta: {
      titulo: "A porta do farol",
      texto:
        "De perto, o farol é maior e mais triste. A tinta branca descasca em tiras, e o sal desenhou mapas nas paredes. A porta de carvalho não se mexe: está trancada por dentro. Mais acima, a janela do térreo está entreaberta, batendo de leve com o vento.\n\nDe dentro da torre, uma voz canta. Baixinho, sem palavras, no mesmo ritmo lento das badaladas que vêm do mar.",
      escolhas: [
        { texto: "Forçar a porta com o ombro", teste: { stat: "forca", cd: 14, sucesso: "terreo", falha: "porta-falha", efeitosFalha: [{ vida: -2 }] } },
        { texto: "Escalar até a janela entreaberta", teste: { stat: "agilidade", cd: 11, sucesso: "terreo", falha: "porta-falha", efeitosFalha: [{ vida: -2 }] } },
        { texto: "Acender a lanterna e rodear a torre, procurando outra entrada", ir: "porao-achado", precisa: { item: "lanterna" } },
      ],
    },
    "porta-falha": {
      titulo: "A torre resiste",
      texto:
        "A torre não cede. Você bate contra a madeira, ou contra a pedra, e a dor sobe pelo ombro até o pescoço. A canção lá dentro não para nem por um instante, como se quem canta nem tivesse percebido você.\n\nA janela continua lá, entreaberta, um pouco mais alta do que parecia.",
      escolhas: [
        { texto: "Tentar a janela de novo, com calma", teste: { stat: "agilidade", cd: 9, sucesso: "terreo", falha: "porta-falha", efeitosFalha: [{ vida: -2 }] } },
        { texto: "Acender a lanterna e rodear a torre", ir: "porao-achado", precisa: { item: "lanterna" } },
        { texto: "Desistir e voltar para o cais", ir: "desistencia" },
      ],
    },
    "porao-achado": {
      titulo: "A portinhola",
      texto:
        "A luz amarela da lanterna treme nas paredes enquanto você contorna a torre. Do lado do mar, onde o vento é pior, a luz encontra no chão uma portinhola de madeira meio enterrada em crosta de sal. Uma argola de ferro serve de puxador.\n\nPor uma fresta, sobe um cheiro de óleo velho e de escuro guardado.",
      escolhas: [
        { texto: "Abrir a portinhola e descer", ir: "porao" },
        { texto: "Voltar para a porta da frente", ir: "porta" },
      ],
    },
    porao: {
      titulo: "O porão",
      texto:
        "A escada range a cada degrau. O porão é baixo, frio, e cheira a óleo rançoso e a pedra molhada. Barris vazios se empilham contra a parede, todos secos. Sua lanterna é a única luz.\n\nNuma prateleira, entre latas de pavio e cordas, há um caderno com capa de couro inchada de umidade. Na capa, a mão cuidadosa de alguém escreveu: \"Ilda\".\n\nLá em cima, a canção continua.",
      escolhas: [
        { texto: "Abrir o diário", ir: "porao-diario" },
        { texto: "Deixar o diário e subir pela escada interna", ir: "escada" },
      ],
    },
    "porao-diario": {
      titulo: "O diário de Ilda",
      texto:
        "As primeiras páginas falam do tempo, do óleo, dos navios que passaram. As últimas, não. A letra vai ficando torta, apressada.\n\n\"Ele toca toda vez que a luz falha. O sino do Santa Ifigênia. Chama. Eu sinto a água subindo dentro de mim quando ele chama.\"\n\n\"O sino do farol tem que responder. Foi o que meu pai disse um dia e eu achei que era história.\"\n\n\"Tentei. O badalo velho se partiu na primeira badalada e caiu pela janela, nas pedras. Agora ele chama mais alto. Vou trancar a porta. Não quero descer até o mar.\"",
      efeitos: [{ flag: "diario" }],
      escolhas: [{ texto: "Fechar o diário e subir", ir: "escada" }],
    },
    terreo: {
      titulo: "O térreo",
      texto:
        "Você cai para dentro de uma sala que já foi arrumada. A mesa está virada, uma xícara quebrada no chão, o fogão frio. A tranca de madeira atravessa a porta por dentro: foi a própria Ilda quem se fechou aqui.\n\nPegadas molhadas, de pés descalços, cruzam o chão e sobem a escada em espiral. Perto do fogão, folhas soltas de um caderno estão espalhadas, como se tivessem sido arrancadas com pressa.",
      escolhas: [
        { texto: "Juntar e ler as folhas", ir: "terreo-folhas" },
        { texto: "Seguir as pegadas escada acima", ir: "escada" },
      ],
    },
    "terreo-folhas": {
      titulo: "Folhas soltas",
      texto:
        "São páginas de um diário, com a letra cada vez mais torta.\n\n\"Ele toca toda vez que a luz falha. O sino do Santa Ifigênia. Chama.\"\n\n\"O sino do farol tem que responder. Tentei. O badalo velho se partiu e caiu pela janela, nas pedras. Agora ele chama mais alto.\"\n\nA última folha só tem uma frase, escrita muitas vezes: \"não descer até o mar\".",
      efeitos: [{ flag: "diario" }],
      escolhas: [{ texto: "Subir a escada", ir: "escada" }],
    },
    escada: {
      titulo: "A escada em espiral",
      texto:
        "São cento e doze degraus de ferro em volta de uma coluna de pedra. A cada volta o ar fica mais úmido, como se a névoa tivesse entrado na torre antes de você. A canção desce pela escada, e agora você ouve que ela não é só de uma voz: por baixo dela, vindo das paredes, das pedras, do mar, a badalada afogada acompanha cada nota.\n\nSua mão no corrimão está molhada, e não é de suor.",
      escolhas: [
        { texto: "Subir em silêncio", ir: "topo" },
        { texto: "Chamar a Ilda pelo nome", ir: "escada-chamou" },
      ],
    },
    "escada-chamou": {
      titulo: "Silêncio",
      texto:
        "\"Ilda!\" Sua voz sobe a escada e volta, pequena.\n\nA canção para. Por um instante, só existe o vento e o seu coração. Então ela recomeça, mais alta, mais perto da janela lá de cima, como se tivesse pressa.",
      efeitos: [{ flag: "chamou" }],
      escolhas: [{ texto: "Correr os últimos degraus", ir: "topo" }],
    },
    topo: {
      titulo: "A sala da lâmpada",
      arte: ["      _____", "     /     \\", "    |       |", "    |       |", "    |_______|", "        |"].join("\n"),
      texto:
        "A sala no alto da torre é toda de vidro, e o vidro está cinza de névoa. A grande lâmpada no centro está apagada e seca, o espelho atrás dela refletindo só escuro. Pendurado numa trave, o sino do farol balança sem badalo, mudo.\n\nIlda está na janela aberta. Cabelos brancos colados no rosto, camisola encharcada, os pés descalços na borda. Ela canta de olhos abertos para o mar, e o mar responde: lá embaixo, a badalada do Santa Ifigênia sobe tão alta que faz o vidro vibrar.\n\nIlda dá um passo à frente.",
      escolhas: [
        { texto: "Prender o badalo no sino do farol e tocar", ir: "resposta", precisa: { item: "badalo" } },
        { texto: "Encher a lâmpada com o óleo da lanterna e acender", ir: "acesa", precisa: { item: "lanterna" } },
        { texto: "Agarrar a Ilda e chamá-la de volta", teste: { stat: "presenca", cd: 13, sucesso: "acorda", falha: "luta" } },
      ],
    },
    luta: {
      titulo: "O transe",
      texto:
        "Você a segura pelos ombros e ela se vira com uma força que não cabe naquele corpo. Os olhos dela não veem você: veem através, até o fundo da baía. Unhas arranham seu braço. Ela se debate em direção à janela, e o mar lá embaixo parece mais perto do que devia.",
      escolhas: [{ texto: "Segurá-la longe da janela, custe o que custar", teste: { stat: "forca", cd: 12, sucesso: "acorda", falha: "acorda", efeitosFalha: [{ vida: -4 }] } }],
    },
    acorda: {
      titulo: "Ilda volta",
      texto:
        "De repente o corpo dela amolece. Ilda pisca, como quem sobe de um mergulho fundo demais, e cai sentada no chão de ferro, tremendo. Ela olha para você como se você tivesse aparecido do nada.\n\n\"O sino do Santa Ifigênia\", ela sussurra. \"Ele chama quando a luz apaga. Eu tentei responder, mas o badalo se partiu e caiu nas pedras.\" Ela aponta o sino mudo na trave. Lá fora, a badalada continua.",
      escolhas: [
        { texto: "Mostrar o badalo que você trouxe e tocar o sino", ir: "resposta", precisa: { item: "badalo" } },
        { texto: "Acender a lâmpada com o óleo da lanterna", ir: "acesa", precisa: { item: "lanterna" } },
        { texto: "Levar a Ilda escada abaixo, em segurança", ir: "parcial" },
      ],
    },
    acesa: {
      titulo: "Luz",
      texto:
        "O óleo da lanterna escorre para a lâmpada, o pavio pega, e o espelho multiplica a chama até ela virar um facho. A luz gira e corta a névoa como uma lâmina. Lá embaixo, no cais, alguém grita de alegria. Ilda cobre os olhos contra a claridade, e o chamado nela parece afrouxar.\n\nMas o sino afundado não para. Ele toca mais forte, mais rápido, quase com raiva, e onde o facho não alcança a névoa volta a se fechar, devagar, paciente.",
      escolhas: [
        { texto: "Prender o badalo no sino e responder", ir: "resposta", precisa: { item: "badalo" } },
        { texto: "Manter o farol aceso até o amanhecer", ir: "parcial" },
      ],
    },
    resposta: {
      titulo: "A resposta",
      texto:
        "O elo partido ainda encaixa. Você prende o badalo de bronze, segura a corda e puxa.\n\nO sino do farol toca, claro, seco, um som de terra firme, e ele atravessa a baía inteira. Lá embaixo, o sino do Santa Ifigênia responde uma vez, mais fraco, como quem reconhece uma voz antiga. E se cala.\n\nA névoa começa a se desfazer como fumaça soprada. Uma a uma, as luzes dos barcos aparecem no escuro, voltando para casa. Ilda, enfim livre do chamado, se encolhe no chão de ferro e chora baixinho. Pela primeira vez em duas noites, não é de medo.",
      fim: "vitoria",
    },
    parcial: {
      titulo: "Até a próxima noite",
      texto:
        "Ilda está a salvo, enrolada num cobertor no cais, com uma caneca de chá entre as mãos e Bento ao lado dela. Os pescadores agradecem, apertam sua mão, oferecem peixe e cachaça.\n\nMas, por baixo do barulho das ondas, o sino do Santa Ifigênia continua tocando. A névoa não foi embora.\n\n\"O sino do farol tem que responder\", Ilda repete, olhando para a torre. Alguém vai precisar voltar lá.",
      fim: "parcial",
    },
    desistencia: {
      titulo: "A volta",
      texto:
        "Você desce a trilha com a canção nas costas. No cais, Bento não pergunta nada; só olha a torre escura e balança a cabeça.\n\nNaquela noite ninguém sai para o mar. E a badalada afogada toca até o amanhecer, como se esperasse alguém.",
      fim: "derrota",
    },
    nevoa: {
      titulo: "A névoa",
      texto:
        "Os ferimentos pesam mais do que você aguenta. O mundo fica branco, molhado, distante, e a última coisa que você ouve é o sino, muito perto, quase dentro da sua cabeça.\n\nVocê acorda no cais, enrolado num cobertor, com Bento ao seu lado. Ele e outros pescadores subiram atrás de você quando viram que você não voltava. O farol continua apagado.",
      fim: "derrota",
    },
  },
};
