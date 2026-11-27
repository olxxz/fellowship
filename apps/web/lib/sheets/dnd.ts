// Ficha de D&D 5e (regras de 2024): atributos, perícias, salvaguardas, combate, ataques, magias e equipamento.

export const ABILITIES = [
  { key: "for", nome: "Força" },
  { key: "des", nome: "Destreza" },
  { key: "con", nome: "Constituição" },
  { key: "int", nome: "Inteligência" },
  { key: "sab", nome: "Sabedoria" },
  { key: "car", nome: "Carisma" },
] as const;
export type AbilityKey = (typeof ABILITIES)[number]["key"];

export const SKILLS: Array<{ key: string; nome: string; attr: AbilityKey }> = [
  { key: "acrobacia", nome: "Acrobacia", attr: "des" },
  { key: "adestrar", nome: "Adestrar Animais", attr: "sab" },
  { key: "arcanismo", nome: "Arcanismo", attr: "int" },
  { key: "atletismo", nome: "Atletismo", attr: "for" },
  { key: "atuacao", nome: "Atuação", attr: "car" },
  { key: "enganacao", nome: "Enganação", attr: "car" },
  { key: "furtividade", nome: "Furtividade", attr: "des" },
  { key: "historia", nome: "História", attr: "int" },
  { key: "intimidacao", nome: "Intimidação", attr: "car" },
  { key: "intuicao", nome: "Intuição", attr: "sab" },
  { key: "investigacao", nome: "Investigação", attr: "int" },
  { key: "medicina", nome: "Medicina", attr: "sab" },
  { key: "natureza", nome: "Natureza", attr: "int" },
  { key: "percepcao", nome: "Percepção", attr: "sab" },
  { key: "persuasao", nome: "Persuasão", attr: "car" },
  { key: "prestidigitacao", nome: "Prestidigitação", attr: "des" },
  { key: "religiao", nome: "Religião", attr: "int" },
  { key: "sobrevivencia", nome: "Sobrevivência", attr: "sab" },
];

export interface DndAttack {
  nome: string;
  bonus: number;
  dano: string;
  tipo: string;
}

export interface DndSpell {
  nome: string;
  nivel: number;
  preparada: boolean;
  descricao: string;
}

export interface DndSheet {
  classe: string;
  subclasse: string;
  especie: string;
  antecedente: string;
  alinhamento: string;
  nivel: number;
  xp: number;
  atributos: Record<AbilityKey, number>;
  salvaguardas: AbilityKey[];
  /** 0 = sem, 1 = proficiente, 2 = especialista. */
  pericias: Record<string, 0 | 1 | 2>;
  ca: number;
  deslocamento: number;
  pv: { atual: number; max: number; temp: number };
  dadosVida: { tipo: string; restantes: number };
  mortes: { sucessos: number; falhas: number };
  inspiracao: boolean;
  ataques: DndAttack[];
  magias: { atributo: AbilityKey; espacos: Array<{ max: number; usados: number }>; lista: DndSpell[] };
  caracteristicas: Array<{ nome: string; descricao: string }>;
  equipamento: string[];
  moedas: { pc: number; pp: number; pe: number; po: number; pl: number };
  proficiencias: string;
  idiomas: string;
  notas: string;
}

export function emptyDnd(): DndSheet {
  return {
    classe: "",
    subclasse: "",
    especie: "",
    antecedente: "",
    alinhamento: "",
    nivel: 1,
    xp: 0,
    atributos: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
    salvaguardas: [],
    pericias: {},
    ca: 10,
    deslocamento: 9,
    pv: { atual: 10, max: 10, temp: 0 },
    dadosVida: { tipo: "d8", restantes: 1 },
    mortes: { sucessos: 0, falhas: 0 },
    inspiracao: false,
    ataques: [],
    magias: { atributo: "int", espacos: Array.from({ length: 9 }, () => ({ max: 0, usados: 0 })), lista: [] },
    caracteristicas: [],
    equipamento: [],
    moedas: { pc: 0, pp: 0, pe: 0, po: 0, pl: 0 },
    proficiencias: "",
    idiomas: "",
    notas: "",
  };
}

export function normalizeDnd(raw: unknown): DndSheet {
  const base = emptyDnd();
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<DndSheet>;
  return {
    ...base,
    ...s,
    atributos: { ...base.atributos, ...s.atributos },
    pv: { ...base.pv, ...s.pv },
    dadosVida: { ...base.dadosVida, ...s.dadosVida },
    mortes: { ...base.mortes, ...s.mortes },
    moedas: { ...base.moedas, ...s.moedas },
    magias: { ...base.magias, ...s.magias },
  };
}

export const modifier = (score: number) => Math.floor((score - 10) / 2);
/** Bônus de proficiência por nível: +2 (1–4), +3 (5–8), +4 (9–12), +5 (13–16), +6 (17–20). */
export const proficiency = (level: number) => 2 + Math.floor((Math.max(1, Math.min(20, level)) - 1) / 4);
export const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
export const formulaFor = (bonus: number) => (bonus === 0 ? "1d20" : `1d20${bonus > 0 ? "+" : "-"}${Math.abs(bonus)}`);

export function skillBonus(sheet: DndSheet, key: string) {
  const skill = SKILLS.find((s) => s.key === key)!;
  return modifier(sheet.atributos[skill.attr]) + (sheet.pericias[key] ?? 0) * proficiency(sheet.nivel);
}

export function saveBonus(sheet: DndSheet, attr: AbilityKey) {
  return modifier(sheet.atributos[attr]) + (sheet.salvaguardas.includes(attr) ? proficiency(sheet.nivel) : 0);
}
