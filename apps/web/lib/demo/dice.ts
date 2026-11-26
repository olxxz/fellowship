// Rolador de DEMONSTRAÇÃO, só para o protótipo funcionar sem servidor.
// No app de verdade a notação é resolvida no servidor por uma biblioteca pronta (ADR 0008),
// e o resultado chega ao navegador já gravado como Roll.
import type { RollDie } from "@fellowship/ui";

export interface DemoRollResult {
  /** Fórmula normalizada, com espaços: "2d20kh1 + 5". */
  formula: string;
  dice: RollDie[];
  modifier: number;
  total: number;
  critical?: { kind: "success" | "failure"; label: string };
}

const TERM = /([+-])?(?:(\d*)d(\d+)(k[hl]\d+)?|(\d+))/gy;
const MAX_DICE = 100;
const MAX_SIDES = 1000;

/** Interpreta "1d20+5", "2d20kh1 + 4", "3d6", "1d20 - 1". Devolve null se a fórmula for inválida. */
export function rollFormula(input: string, random: () => number = Math.random): DemoRollResult | null {
  // "1d20 5" é um erro de digitação, não "1d205".
  if (/[\dhl]\s+\d/i.test(input)) return null;
  const source = input.toLowerCase().replace(/\s+/g, "");
  if (!source) return null;

  const dice: RollDie[] = [];
  const parts: string[] = [];
  let modifier = 0;
  let total = 0;
  let d20Groups = 0;
  let keptD20: number | undefined;

  TERM.lastIndex = 0;
  let pos = 0;
  while (pos < source.length) {
    TERM.lastIndex = pos;
    const m = TERM.exec(source);
    if (!m || m.index !== pos || m[0] === "") return null;
    if (pos > 0 && !m[1]) return null; // termos depois do primeiro precisam de sinal
    const sign = m[1] === "-" ? -1 : 1;
    pos = TERM.lastIndex;

    if (m[5] !== undefined) {
      const value = Number(m[5]);
      modifier += sign * value;
      total += sign * value;
      parts.push(`${sign < 0 ? "-" : "+"} ${value}`);
      continue;
    }

    const count = m[2] === "" || m[2] === undefined ? 1 : Number(m[2]);
    const sides = Number(m[3]);
    if (count < 1 || count > MAX_DICE || sides < 2 || sides > MAX_SIDES) return null;
    const keep = m[4] ? { highest: m[4][1] === "h", n: Number(m[4].slice(2)) } : null;
    if (keep && (keep.n < 1 || keep.n > count)) return null;

    const values = Array.from({ length: count }, () => 1 + Math.floor(random() * sides));
    const kept = new Set<number>();
    if (keep) {
      const order = values.map((v, i) => [v, i] as const).sort((a, b) => (keep.highest ? b[0] - a[0] : a[0] - b[0]));
      order.slice(0, keep.n).forEach(([, i]) => kept.add(i));
    } else {
      values.forEach((_, i) => kept.add(i));
    }
    values.forEach((value, i) => {
      dice.push(kept.has(i) ? { value } : { value, discarded: true });
      if (kept.has(i)) total += sign * value;
    });

    if (sides === 20) {
      d20Groups++;
      const keptValues = values.filter((_, i) => kept.has(i));
      keptD20 = keptValues.length === 1 ? keptValues[0] : undefined;
    }
    const term = `${count}d${sides}${m[4] ?? ""}`;
    parts.push(parts.length === 0 && sign > 0 ? term : `${sign < 0 ? "-" : "+"} ${term}`);
  }

  let critical: DemoRollResult["critical"];
  if (d20Groups === 1 && keptD20 === 20) critical = { kind: "success", label: "20 natural" };
  if (d20Groups === 1 && keptD20 === 1) critical = { kind: "failure", label: "1 natural" };

  const formula = parts.join(" ").replace(/^\+ /, "");
  return { formula, dice, modifier, total, ...(critical && { critical }) };
}

/** Teste com atributo, no estilo do template de exemplo: (atributo)d20, fica o maior, + bônus. */
export function skillFormula(attribute: number, bonus: number) {
  const dice = attribute <= 1 ? "1d20" : `${attribute}d20kh1`;
  return bonus ? `${dice} + ${bonus}` : dice;
}
