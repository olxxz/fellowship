// Importa uma ficha do homebrew escrita em Markdown (o formato das fichas no Obsidian, como a do Bjørn).
// Melhor esforço: o que reconhece vira campo da ficha; o resto (imagens, linhas soltas) vai para as notas.
import { emptyHomebrew, type HbAbility, type HbSlot, type HomebrewSheet } from "./homebrew";

const num = (s: string | undefined) => {
  const n = Number(String(s ?? "").replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const clean = (s: string) => s.replace(/\*\*/g, "").replace(/\\\|/g, "|").trim();

export interface ImportedSheet {
  name: string;
  sheet: HomebrewSheet;
}

export function importHomebrewMarkdown(md: string): ImportedSheet {
  const sheet = emptyHomebrew();
  sheet.atributos = [];
  sheet.corpo = [];
  const lines = md.replace(/\r/g, "").split("\n").map((l) => l.replace(/\s+$/, ""));
  let name = "Personagem";
  let section = "";
  let sub = "";
  let artifact: { nome: string; descricao: string } | null = null;
  let ability: HbAbility | null = null;
  let slot: HbSlot | null = null;
  let traitsBlank = false;
  const notes: string[] = [];

  const flushAbility = () => {
    if (ability) {
      ability.descricao = ability.descricao.trim();
      sheet.habilidades.push(ability);
    }
    ability = null;
  };
  const flushArtifact = () => {
    if (artifact) sheet.artefatos.push({ nome: artifact.nome, descricao: artifact.descricao.trim() });
    artifact = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/^>\s?/, "").trimEnd();
    const t = line.trim();
    if (/!\[.*\]\(.*\)/.test(t)) continue; // imagens do Obsidian ficam de fora

    const h1 = t.match(/^#\s+(.+)/);
    if (h1 && !t.startsWith("##")) {
      name = clean(h1[1]!);
      continue;
    }
    // "##" sozinho separa blocos no Obsidian: só fecha a seção atual.
    if (/^#{2,}$/.test(t)) {
      flushAbility();
      flushArtifact();
      section = "";
      continue;
    }
    const h2 = t.match(/^##\s+(.*)/);
    if (h2 && !t.startsWith("###")) {
      flushAbility();
      flushArtifact();
      section = clean(h2[1]!).toLowerCase();
      sub = "";
      slot = null;
      traitsBlank = false;
      continue;
    }
    const h3 = t.match(/^###\s+(.*)/);
    if (h3) {
      const title = clean(h3[1]!);
      // Status em títulos: "### HP: 146 / 141"
      const stat = title.match(/^(HP|SP|Nível|Nivel|XP)\s*:\s*(-?\d+)\s*(?:\/\s*(-?\d+))?/i);
      if (stat) {
        const [, k, a, b] = stat;
        const key = k!.toLowerCase();
        if (key === "hp") sheet.hp = { atual: num(a), max: num(b ?? a) };
        else if (key === "sp") sheet.sp = { atual: num(a), max: num(b ?? a) };
        else if (key === "xp") sheet.xp = { atual: num(a), max: num(b ?? a) };
        else sheet.nivel = num(a);
        continue;
      }
      if (section.startsWith("atributos")) {
        sub = title;
        sheet.atributos.push({ titulo: title, itens: [] });
        continue;
      }
      if (section.includes("armas") || section.includes("artefatos")) {
        flushArtifact();
        artifact = { nome: title, descricao: "" };
        continue;
      }
      if (section.startsWith("k/d")) {
        sub = title.toLowerCase();
        continue;
      }
      continue;
    }

    // Cabeçalho: "**Classe:** Bárbaro"
    const kv = t.match(/^\*\*(.+?):\*\*\s*(.*)$/);
    if (kv) {
      const k = kv[1]!.toLowerCase();
      if (k.startsWith("classe")) sheet.classe = clean(kv[2]!);
      else if (k.startsWith("tend")) sheet.tendencia = clean(kv[2]!);
      continue;
    }

    if (!t) {
      if (section.startsWith("vantagens") && (sheet.vantagens.length > 0)) traitsBlank = true;
      continue;
    }

    if (section.startsWith("atributos") && t.startsWith("|")) {
      if (/^\|\s*-+/.test(t)) continue;
      const cells = t
        .replace(/\\\|/g, "¦")
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cells.length < 2) continue;
      const [nivelStr, valorStr] = cells[1]!.split("¦").map((c) => c.trim());
      const [valor, bonus] = (valorStr ?? "").split("+").map((c) => num(c));
      if (!sheet.atributos.length) sheet.atributos.push({ titulo: sub || "Atributos", itens: [] });
      sheet.atributos[sheet.atributos.length - 1]!.itens.push({ nome: cells[0]!, nivel: num(nivelStr), valor: valor ?? 0, bonus: bonus ?? 0 });
      continue;
    }

    if (section.startsWith("habilidades")) {
      const m = t.match(/^[*-]\s+(.+?)\s+(\d+)\s*\/\s*(\d+)\s*-?\s*(.*)$/);
      if (m) {
        flushAbility();
        ability = { nome: clean(m[1]!), nivel: num(m[2]), max: num(m[3]), descricao: m[4] ? `${m[4]}\n` : "", custo: "", formula: "" };
        continue;
      }
      if (ability) {
        if (/^(mana|sp|custo)\b/i.test(t)) ability.custo = t;
        else {
          ability.descricao += `${t}\n`;
          const dice = t.match(/\d*d\d+(?:\s*[x*/]\s*\d+)?/i);
          if (dice && !ability.formula) ability.formula = dice[0].replace(/\s+/g, "");
        }
        continue;
      }
    }

    if (section.startsWith("perícias") || section.startsWith("pericias")) {
      sheet.pericias.push(t.replace(/^[*-]\s+/, ""));
      continue;
    }

    if (section.startsWith("vantagens")) {
      (traitsBlank ? sheet.desvantagens : sheet.vantagens).push(t.replace(/^[*-]\s+/, ""));
      continue;
    }

    if (section.startsWith("corpo")) {
      const top = line.match(/^[*-]\s+([^-]+?)\s*(?:-\s*(.*))?$/);
      if (top && !/^\s/.test(line)) {
        slot = { slot: clean(top[1]!), itens: top[2]?.trim() ? [{ nome: top[2].trim(), efeito: "" }] : [] };
        sheet.corpo.push(slot);
        continue;
      }
      const item = line.match(/^\s+[-*]\s+(.*)$/);
      if (item && slot) {
        const text = item[1]!.trim();
        const isEffect = /^\(|^[+-]\s*\d/.test(text) || /^\*/.test(line.trim()) && slot.itens.length > 0;
        if (isEffect && slot.itens.length) {
          const last = slot.itens[slot.itens.length - 1]!;
          last.efeito = [last.efeito, text.replace(/^\(\s*|\s*\)$/g, "")].filter(Boolean).join(" ");
        } else slot.itens.push({ nome: text, efeito: "" });
        continue;
      }
    }

    if (section.startsWith("mochila")) {
      const money = t.match(/dinheiro\s*:\s*(\d+)/i);
      if (money) sheet.dinheiro = num(money[1]);
      else sheet.mochila.push(t.replace(/^(\d+\.|[-*])\s+/, ""));
      continue;
    }

    if (section.startsWith("k/d")) {
      const item = t.replace(/^(\d+\.|[-*])\s+/, "");
      if (sub.startsWith("death")) sheet.deaths.push(item);
      else sheet.kills.push(item);
      continue;
    }

    if (artifact) {
      artifact.descricao += `${t.replace(/^[-*]\s+/, "• ")}\n`;
      continue;
    }

    notes.push(t);
  }
  flushAbility();
  flushArtifact();
  if (!sheet.atributos.length) sheet.atributos = emptyHomebrew().atributos;
  if (!sheet.corpo.length) sheet.corpo = emptyHomebrew().corpo;
  sheet.notas = notes.filter((n) => n !== "#").join("\n");
  return { name, sheet };
}
