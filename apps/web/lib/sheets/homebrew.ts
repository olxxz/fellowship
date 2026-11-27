// Ficha do homebrew do grupo (a partir da ficha do Bjørn). Tudo é texto/número editável: as regras
// de cálculo do sistema ficam com o grupo; a ficha só guarda e ajuda a rolar.

export interface HbAttribute {
  nome: string;
  /** Nível/pontos do atributo (a primeira coluna da tabela). */
  nivel: number;
  /** Valor base e bônus (a segunda coluna, "8 + 4"). */
  valor: number;
  bonus: number;
}

export interface HbAbility {
  nome: string;
  nivel: number;
  max: number;
  descricao: string;
  /** Custo em mana/SP ("10 x nível"). */
  custo: string;
  /** Fórmula para rolar (dano/efeito). {nivel} = nível do personagem, {hab} = nível da habilidade. */
  formula: string;
}

export interface HbItem {
  nome: string;
  efeito: string;
}

export interface HbSlot {
  slot: string;
  itens: HbItem[];
}

export interface HbArtifact {
  nome: string;
  descricao: string;
}

export interface HomebrewSheet {
  classe: string;
  tendencia: string;
  nivel: number;
  xp: { atual: number; max: number };
  hp: { atual: number; max: number };
  sp: { atual: number; max: number };
  /** Fórmula dos testes de atributo. {total} = valor + bônus, {nivel} = nível do atributo. */
  formulaTeste: string;
  atributos: { titulo: string; itens: HbAttribute[] }[];
  habilidades: HbAbility[];
  pericias: string[];
  vantagens: string[];
  desvantagens: string[];
  corpo: HbSlot[];
  dinheiro: number;
  mochila: string[];
  kills: string[];
  deaths: string[];
  artefatos: HbArtifact[];
  notas: string;
}

const attr = (nome: string): HbAttribute => ({ nome, nivel: 0, valor: 0, bonus: 0 });

export function emptyHomebrew(): HomebrewSheet {
  return {
    classe: "",
    tendencia: "",
    nivel: 1,
    xp: { atual: 0, max: 100 },
    hp: { atual: 10, max: 10 },
    sp: { atual: 10, max: 10 },
    formulaTeste: "1d20 + {total}",
    atributos: [
      { titulo: "Físicos", itens: ["Força", "Destreza", "Agilidade", "Resistência", "Inteligência"].map(attr) },
      { titulo: "Mentais", itens: ["Percepção", "Carisma", "Furtividade"].map(attr) },
    ],
    habilidades: [],
    pericias: [],
    vantagens: [],
    desvantagens: [],
    corpo: ["Cabeça", "Armadura", "Cinto", "Braços", "Dedos", "Offhand", "Mainhand"].map((slot) => ({ slot, itens: [] })),
    dinheiro: 0,
    mochila: [],
    kills: [],
    deaths: [],
    artefatos: [],
    notas: "",
  };
}

/** Completa uma ficha salva com os campos que faltarem (fichas antigas ou importadas). */
export function normalizeHomebrew(raw: unknown): HomebrewSheet {
  const base = emptyHomebrew();
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<HomebrewSheet>;
  return { ...base, ...s, xp: { ...base.xp, ...s.xp }, hp: { ...base.hp, ...s.hp }, sp: { ...base.sp, ...s.sp } };
}

/** Troca {total}, {nivel} e {hab} na fórmula. */
export function fillFormula(formula: string, vars: Record<string, number>) {
  return formula.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? 0));
}
