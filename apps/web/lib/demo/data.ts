// Dados de demonstração. Tudo aqui é falso e vive só no navegador; nada vai para um servidor.
// Quando o Supabase entrar, estas estruturas viram consultas ao banco com os mesmos campos do modelo de domínio.
import type { IconName, PlayerColor, PresenceStatus, RollDie } from "@fellowship/ui";

export interface DemoUser {
  id: string;
  name: string;
  color: PlayerColor;
  status: PresenceStatus;
  activity?: string;
  role: "narrador" | "mesa" | "membro";
}

export interface DemoChannel {
  id: string;
  name: string;
  icon: IconName;
  kind: "texto" | "anuncios" | "voz" | "galeria" | "funcional";
  topic?: string;
  meta?: string;
  metaTone?: "faint" | "mesa";
  unread?: boolean;
}

export interface DemoCharacter {
  id: string;
  name: string;
  /** Dono vazio = NPC do mestre. */
  ownerId: string | null;
  color: PlayerColor;
  title: string;
  sheet?: DemoSheet;
}

export interface DemoSheet {
  attributes: Array<{ id: string; label: string; value: number }>;
  vitals: { hp: [number, number]; mana: [number, number] };
  skills: Array<{ id: string; label: string; attribute: string; bonus: number }>;
  inventory: string[];
}

export interface DemoCampaign {
  id: string;
  name: string;
  icon: IconName;
  color: PlayerColor;
  live?: { session: number };
  nextSession?: string;
  masterId: string;
  characterIds: string[];
  scenes: string[];
}

export interface DemoSpace {
  id: string;
  name: string;
  short: string;
  color: PlayerColor;
  description: string;
  categories: Array<{ name: string; channelIds: string[] }>;
  channels: DemoChannel[];
  campaigns: DemoCampaign[];
}

export type DemoMessage =
  | {
      id: string;
      type: "text";
      authorId: string;
      characterId?: string;
      text: string;
      time: string;
      narration?: boolean;
      whisperTo?: string;
      pending?: boolean;
    }
  | {
      id: string;
      type: "roll";
      authorId: string;
      characterId?: string;
      label?: string;
      formula: string;
      dice: RollDie[];
      modifier: number;
      total: number;
      hidden?: boolean;
      critical?: { kind: "success" | "failure"; label: string };
      time: string;
    }
  | { id: string; type: "notice"; text: string; tone: "neutral" | "mesa"; icon?: IconName; time: string };

export const users: DemoUser[] = [
  { id: "rafa", name: "Rafa", color: 4, status: "em-sessao", activity: "Mestrando: A Maldição de Vel", role: "narrador" },
  { id: "ana", name: "Ana", color: 1, status: "em-sessao", activity: "Jogando: A Maldição de Vel", role: "mesa" },
  { id: "bruno", name: "Bruno", color: 2, status: "em-sessao", activity: "Jogando: A Maldição de Vel", role: "mesa" },
  { id: "carla", name: "Carla", color: 3, status: "em-sessao", activity: "Jogando: A Maldição de Vel", role: "mesa" },
  { id: "dani", name: "Dani", color: 5, status: "em-sessao", activity: "Jogando: A Maldição de Vel", role: "mesa" },
  { id: "edu", name: "Edu", color: 6, status: "online", role: "membro" },
  { id: "fe", name: "Fê", color: 3, status: "ausente", role: "membro" },
  { id: "gabi", name: "Gabi", color: 2, status: "offline", role: "membro" },
];

function sheet(attrs: [number, number, number, number, number], hp: [number, number], mana: [number, number], skills: DemoSheet["skills"], inventory: string[]): DemoSheet {
  const [agi, forca, int, pre, vig] = attrs;
  return {
    attributes: [
      { id: "agi", label: "Agilidade", value: agi },
      { id: "for", label: "Força", value: forca },
      { id: "int", label: "Intelecto", value: int },
      { id: "pre", label: "Presença", value: pre },
      { id: "vig", label: "Vigor", value: vig },
    ],
    vitals: { hp, mana },
    skills,
    inventory,
  };
}

export const characters: DemoCharacter[] = [
  {
    id: "kael",
    name: "Kael",
    ownerId: "ana",
    color: 1,
    title: "Elfo da floresta · Patrulheiro",
    sheet: sheet(
      [3, 1, 1, 2, 2],
      [14, 18],
      [6, 8],
      [
        { id: "pontaria", label: "Pontaria", attribute: "agi", bonus: 5 },
        { id: "furtividade", label: "Furtividade", attribute: "agi", bonus: 5 },
        { id: "percepcao", label: "Percepção", attribute: "pre", bonus: 5 },
        { id: "sobrevivencia", label: "Sobrevivência", attribute: "int", bonus: 5 },
        { id: "luta", label: "Luta", attribute: "for", bonus: 0 },
      ],
      ["Arco longo", "Flechas (18)", "Capa élfica", "Corda de seda (15 m)"],
    ),
  },
  {
    id: "brom",
    name: "Brom",
    ownerId: "bruno",
    color: 2,
    title: "Anão das colinas · Guerreiro",
    sheet: sheet(
      [1, 3, 1, 1, 3],
      [24, 27],
      [2, 4],
      [
        { id: "luta", label: "Luta", attribute: "for", bonus: 10 },
        { id: "atletismo", label: "Atletismo", attribute: "for", bonus: 5 },
        { id: "fortitude", label: "Fortitude", attribute: "vig", bonus: 5 },
        { id: "intimidacao", label: "Intimidação", attribute: "pre", bonus: 5 },
      ],
      ["Machado de guerra", "Escudo de carvalho", "Cantil de hidromel"],
    ),
  },
  {
    id: "lia",
    name: "Lia",
    ownerId: "carla",
    color: 3,
    title: "Humana · Ocultista",
    sheet: sheet(
      [1, 1, 3, 2, 1],
      [9, 12],
      [7, 12],
      [
        { id: "ocultismo", label: "Ocultismo", attribute: "int", bonus: 10 },
        { id: "investigacao", label: "Investigação", attribute: "int", bonus: 5 },
        { id: "vontade", label: "Vontade", attribute: "pre", bonus: 5 },
      ],
      ["Grimório de capa preta", "Giz de prata", "Velas (4)"],
    ),
  },
  {
    id: "nyx",
    name: "Nyx",
    ownerId: "dani",
    color: 5,
    title: "Meio-elfa · Ladina",
    sheet: sheet(
      [3, 1, 2, 2, 1],
      [11, 15],
      [4, 6],
      [
        { id: "furtividade", label: "Furtividade", attribute: "agi", bonus: 10 },
        { id: "crime", label: "Crime", attribute: "agi", bonus: 5 },
        { id: "enganacao", label: "Enganação", attribute: "pre", bonus: 5 },
      ],
      ["Adagas gêmeas", "Gazuas", "Capuz escuro"],
    ),
  },
  { id: "narrador", name: "Narrador", ownerId: null, color: 4, title: "A voz da campanha" },
  { id: "mira", name: "Velha Mira", ownerId: null, color: 6, title: "NPC · Barqueira do rio" },
  { id: "doran", name: "Capitão Doran", ownerId: null, color: 2, title: "NPC · Guarda da ponte" },
];

const campaignChannels = ["mesa", "ingame", "outgame", "sussurros", "fichas", "diario", "compendio", "mapa"] as const;
export type CampaignChannelId = (typeof campaignChannels)[number];

export const campaignChannelInfo: Record<CampaignChannelId, { name: string; icon: IconName; description: string }> = {
  mesa: { name: "Mesa", icon: "dice", description: "Voz da sessão com os retratos" },
  ingame: { name: "Ingame", icon: "quote", description: "O que os personagens dizem" },
  outgame: { name: "Outgame", icon: "chat", description: "Conversa entre jogadores" },
  sussurros: { name: "Sussurros", icon: "lock", description: "Entre um jogador e o mestre" },
  fichas: { name: "Fichas", icon: "sheet", description: "As fichas dos personagens" },
  diario: { name: "Diário", icon: "book", description: "O que aconteceu em cada sessão" },
  compendio: { name: "Compêndio", icon: "claw", description: "Bestiário, itens, magias e lugares revelados" },
  mapa: { name: "Mapa", icon: "map", description: "Grid, cenário e tokens" },
};
export const campaignChannelIds = campaignChannels;

export const spaces: DemoSpace[] = [
  {
    id: "vel",
    name: "Terras de Vel",
    short: "TV",
    color: 4,
    description: "Um reino de pontes e névoa, onde cada rio guarda um nome antigo.",
    categories: [
      { name: "Mural", channelIds: ["anuncios", "regras", "agenda"] },
      { name: "Conversa", channelIds: ["geral", "arte", "taverna"] },
    ],
    channels: [
      { id: "anuncios", name: "Anúncios", icon: "announcement", kind: "anuncios", topic: "Só o Narrador escreve aqui.", unread: true },
      { id: "regras", name: "Regras", icon: "rules", kind: "funcional", topic: "Regras da casa e ferramentas de segurança." },
      { id: "agenda", name: "Agenda", icon: "calendar", kind: "funcional", topic: "Próximas sessões e enquetes de data.", meta: "qui 20h", metaTone: "mesa" },
      { id: "geral", name: "Geral", icon: "chat", kind: "texto", topic: "Conversa do grupo fora do jogo." },
      { id: "arte", name: "Arte e fichas", icon: "gallery", kind: "galeria", topic: "Retratos, mapas e handouts." },
      { id: "taverna", name: "Taverna", icon: "mic", kind: "voz", topic: "Sala de voz para conversar.", meta: "2 na sala" },
    ],
    campaigns: [
      {
        id: "maldicao",
        name: "A Maldição de Vel",
        icon: "dice",
        color: 4,
        live: { session: 12 },
        masterId: "rafa",
        characterIds: ["kael", "brom", "lia", "nyx"],
        scenes: ["A ponte de Vel", "O olho na lanterna", "A barqueira", "O outro lado do rio"],
      },
      {
        id: "karn",
        name: "Ecos de Karn",
        icon: "map",
        color: 1,
        nextSession: "sáb 15h",
        masterId: "rafa",
        characterIds: [],
        scenes: [],
      },
    ],
  },
  {
    id: "neon",
    name: "Neon Rio",
    short: "NR",
    color: 5,
    description: "Cyberpunk carioca. Ainda sem campanhas.",
    categories: [{ name: "Conversa", channelIds: ["geral", "anuncios"] }],
    channels: [
      { id: "geral", name: "Geral", icon: "chat", kind: "texto", topic: "Conversa do grupo." },
      { id: "anuncios", name: "Anúncios", icon: "announcement", kind: "anuncios" },
    ],
    campaigns: [],
  },
];

export const userById = (id: string) => users.find((u) => u.id === id);
export const characterById = (id: string) => characters.find((c) => c.id === id);
export const spaceById = (id: string) => spaces.find((s) => s.id === id);
export const campaignById = (space: DemoSpace, id: string) => space.campaigns.find((c) => c.id === id);
export const channelById = (space: DemoSpace, id: string) => space.channels.find((c) => c.id === id);

/** Chave de um canal no estado de mensagens: "vel/geral" ou "vel/maldicao/ingame". */
export const channelKey = (...parts: string[]) => parts.join("/");

let seq = 0;
const id = () => `seed-${++seq}`;

export const seedMessages: Record<string, DemoMessage[]> = {
  "vel/anuncios": [
    { id: id(), type: "text", authorId: "rafa", time: "seg 18:40", text: "Próxima sessão: quinta, 20h. Sessão 12 de A Maldição de Vel. A sessão de Ecos de Karn fica para sábado, 15h." },
  ],
  "vel/geral": [
    { id: id(), type: "text", authorId: "rafa", time: "hoje 19:02", text: "Sessão confirmada para quinta, 20h. Quem não puder, avisa aqui até quarta." },
    { id: id(), type: "text", authorId: "ana", time: "hoje 19:05", text: "Confirmado! Vou levar o mapa que desenhei da ponte." },
    { id: id(), type: "text", authorId: "ana", time: "hoje 19:05", text: "Alguém lembra o nome do ferreiro de Vel?" },
    { id: id(), type: "text", authorId: "bruno", time: "hoje 19:11", text: "Era o Hadrik. Ele ainda me deve uma espada." },
    { id: id(), type: "text", authorId: "edu", time: "hoje 19:30", text: "Posso assistir à sessão de quinta? Queria entender como funciona antes de entrar na próxima campanha." },
    { id: id(), type: "text", authorId: "rafa", time: "hoje 19:32", text: "Pode sim, entra como espectador na Mesa." },
  ],
  "vel/maldicao/ingame": [
    { id: id(), type: "notice", tone: "mesa", icon: "dice", time: "20:02", text: "Sessão 12 · Cena 1: A ponte de Vel" },
    { id: id(), type: "text", authorId: "rafa", characterId: "narrador", narration: true, time: "20:03", text: "A névoa sobe do rio e engole metade da ponte. Do outro lado, uma lanterna balança sozinha, sem ninguém para segurá-la." },
    { id: id(), type: "text", authorId: "ana", characterId: "kael", time: "20:04", text: "Ninguém atravessa ainda. Tem alguma coisa errada com essa luz." },
    { id: id(), type: "text", authorId: "bruno", characterId: "brom", time: "20:04", text: "Luz é luz, elfo. Eu vou na frente." },
    { id: id(), type: "roll", authorId: "bruno", characterId: "brom", label: "Atletismo", formula: "1d20 + 4", dice: [{ value: 15 }], modifier: 4, total: 19, time: "20:05" },
    { id: id(), type: "text", authorId: "rafa", characterId: "narrador", narration: true, time: "20:05", text: "Brom firma o pé nas tábuas molhadas. A ponte range, mas aguenta." },
    { id: id(), type: "notice", tone: "mesa", icon: "eye", time: "20:06", text: "O mestre pediu um teste de Percepção para Kael" },
    { id: id(), type: "roll", authorId: "ana", characterId: "kael", label: "Percepção", formula: "2d20kh1 + 5", dice: [{ value: 17 }, { value: 9, discarded: true }], modifier: 5, total: 22, time: "20:06" },
    { id: id(), type: "text", authorId: "carla", characterId: "lia", time: "20:07", text: "A lanterna não tem chama. Tem um olho." },
    { id: id(), type: "roll", authorId: "rafa", characterId: "narrador", formula: "1d20 + 3", dice: [{ value: 11 }], modifier: 3, total: 14, hidden: true, time: "20:07" },
  ],
  "vel/maldicao/outgame": [
    { id: id(), type: "text", authorId: "dani", time: "20:01", text: "Gente, desculpa o atraso, a internet caiu." },
    { id: id(), type: "text", authorId: "rafa", time: "20:01", text: "Sem problema, a Nyx estava de vigia no acampamento. Ela entra na próxima cena." },
    { id: id(), type: "text", authorId: "carla", time: "20:08", text: "Rafa, a Lia pode usar Visão Arcana agora ou só em combate?" },
    { id: id(), type: "text", authorId: "rafa", time: "20:08", text: "Pode usar agora, mas gasta 2 de Mana." },
  ],
  "vel/maldicao/sussurros": [
    { id: id(), type: "text", authorId: "dani", characterId: "nyx", whisperTo: "Narrador", time: "20:09", text: "A Nyx quer pegar a lanterna sem ninguém ver." },
    { id: id(), type: "text", authorId: "rafa", characterId: "narrador", whisperTo: "Nyx", time: "20:09", text: "Rola Furtividade quando a Lia se distrair com o olho." },
  ],
};
