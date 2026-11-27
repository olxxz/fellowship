// Modelo de ficha da campanha: um sistema pronto (homebrew do grupo, D&D 5e 2024) ou um modelo próprio que
// parte de um deles e muda atributos, perícias e seções. O mestre escolhe um por campanha.
import type { CampaignSystem } from "@fellowship/db";
import { ABILITIES, SKILLS } from "./dnd";

export interface DndAbilityDef {
  key: string;
  nome: string;
}
export interface DndSkillDef {
  key: string;
  nome: string;
  attr: string;
}

export const DND_SECTIONS = {
  combate: "Combate",
  salvaguardas: "Salvaguardas",
  pericias: "Perícias",
  ataques: "Ataques",
  magias: "Magias",
  caracteristicas: "Características e talentos",
  equipamento: "Equipamento",
  notas: "Proficiências, idiomas e notas",
} as const;
export type DndSection = keyof typeof DND_SECTIONS;

export const HB_SECTIONS = {
  habilidades: "Habilidades",
  pericias: "Perícias",
  vantagens: "Vantagens e desvantagens",
  corpo: "Corpo",
  mochila: "Mochila",
  kd: "K/D",
  artefatos: "Armas e artefatos",
  notas: "Notas",
} as const;
export type HbSection = keyof typeof HB_SECTIONS;

export interface DndConfig {
  abilities: DndAbilityDef[];
  skills: DndSkillDef[];
  sections: Record<DndSection, boolean>;
}

export interface HbConfig {
  groups: Array<{ titulo: string; itens: string[] }>;
  formulaTeste: string;
  /** Recursos com barra (HP, SP, XP…). */
  sections: Record<HbSection, boolean>;
}

export type SheetModel =
  | { system: "dnd2024"; templateId: string | null; name: string; config: DndConfig }
  | { system: "homebrew"; templateId: string | null; name: string; config: HbConfig };

const allOn = <K extends string>(keys: Record<K, string>) => Object.fromEntries(Object.keys(keys).map((k) => [k, true])) as Record<K, boolean>;

export const SYSTEM_NAMES: Record<CampaignSystem, string> = { homebrew: "Homebrew do grupo", dnd2024: "D&D 5e (2024)" };

export function defaultDndConfig(): DndConfig {
  return { abilities: ABILITIES.map((a) => ({ key: a.key, nome: a.nome })), skills: SKILLS.map((s) => ({ ...s })), sections: allOn(DND_SECTIONS) };
}

export function defaultHbConfig(): HbConfig {
  return {
    groups: [
      { titulo: "Físicos", itens: ["Força", "Destreza", "Agilidade", "Resistência", "Inteligência"] },
      { titulo: "Mentais", itens: ["Percepção", "Carisma", "Furtividade"] },
    ],
    formulaTeste: "1d20 + {total}",
    sections: allOn(HB_SECTIONS),
  };
}

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12) || "x";

/** Completa e limpa a configuração salva (modelos antigos, campos faltando, chaves repetidas). */
export function normalizeConfig(system: CampaignSystem, raw: unknown): DndConfig | HbConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (system === "dnd2024") {
    const base = defaultDndConfig();
    const abilities = Array.isArray(r.abilities)
      ? (r.abilities as DndAbilityDef[]).filter((a) => a && typeof a.nome === "string" && a.nome.trim()).map((a) => ({ key: a.key || slug(a.nome), nome: a.nome }))
      : base.abilities;
    const keys = new Set<string>();
    const uniq = abilities.filter((a) => (keys.has(a.key) ? false : (keys.add(a.key), true)));
    const skills = Array.isArray(r.skills)
      ? (r.skills as DndSkillDef[]).filter((s) => s && typeof s.nome === "string" && s.nome.trim()).map((s) => ({ key: s.key || slug(s.nome), nome: s.nome, attr: keys.has(s.attr) ? s.attr : (uniq[0]?.key ?? "for") }))
      : base.skills;
    return { abilities: uniq.length ? uniq : base.abilities, skills, sections: { ...base.sections, ...((r.sections as object) ?? {}) } };
  }
  const base = defaultHbConfig();
  const groups = Array.isArray(r.groups)
    ? (r.groups as HbConfig["groups"]).filter((g) => g && typeof g.titulo === "string").map((g) => ({ titulo: g.titulo, itens: Array.isArray(g.itens) ? g.itens.filter((i) => typeof i === "string") : [] }))
    : base.groups;
  return {
    groups,
    formulaTeste: typeof r.formulaTeste === "string" && r.formulaTeste.trim() ? r.formulaTeste : base.formulaTeste,
    sections: { ...base.sections, ...((r.sections as object) ?? {}) },
  };
}

/** Modelo da campanha a partir do sistema e (se houver) do modelo próprio escolhido pelo mestre. */
export function sheetModel(system: CampaignSystem, template?: { id: string; name: string; base: CampaignSystem; config: unknown } | null): SheetModel {
  if (template) {
    return template.base === "dnd2024"
      ? { system: "dnd2024", templateId: template.id, name: template.name, config: normalizeConfig("dnd2024", template.config) as DndConfig }
      : { system: "homebrew", templateId: template.id, name: template.name, config: normalizeConfig("homebrew", template.config) as HbConfig };
  }
  return system === "dnd2024"
    ? { system: "dnd2024", templateId: null, name: SYSTEM_NAMES.dnd2024, config: defaultDndConfig() }
    : { system: "homebrew", templateId: null, name: SYSTEM_NAMES.homebrew, config: defaultHbConfig() };
}

export { slug as templateKey };
