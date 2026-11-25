import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Validação de contraste da paleta (WCAG 2.2): 4.5:1 para texto, 3:1 para texto grande, bordas e indicadores.

type Theme = "dark" | "light";
interface ColorToken {
  name: string;
  value: Record<Theme, string>;
}

const tokens = JSON.parse(readFileSync(join(__dirname, "../tokens/tokens.json"), "utf8"));
const colors = Object.fromEntries((tokens.color.tokens as ColorToken[]).map((t) => [t.name, t.value]));

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const color = (name: string, theme: Theme) => (name.startsWith("#") ? name : colors[name]![theme]);

/** [primeiro plano, fundo, mínimo] — as combinações que a interface usa. */
const TEXT = 4.5;
const LARGE_OR_UI = 3;
const pairs: Array<[string, string, number]> = [
  ["text", "bg-content", TEXT],
  ["text", "bg-sidebar", TEXT],
  ["text", "bg-raised", TEXT],
  ["text", "chat-ingame", TEXT],
  ["text", "mesa-surface", TEXT],
  ["text", "danger-soft", TEXT],
  ["text-muted", "bg-content", TEXT],
  ["text-muted", "bg-sidebar", TEXT],
  ["text-muted", "bg-raised", TEXT],
  ["text-muted", "mesa-surface", TEXT],
  ["text-faint", "bg-sidebar", TEXT],
  ["text-faint", "bg-content", TEXT],
  ["accent-text", "bg-content", TEXT],
  ["on-accent", "accent", TEXT],
  ["#ffffff", "danger", TEXT],
  ["mesa-ink", "mesa-gold", TEXT],
  ["mesa-text", "mesa-surface", TEXT],
  ["mesa-text", "bg-sidebar", TEXT],
  ["warning", "bg-content", TEXT],
  ["focus-ring", "bg-content", LARGE_OR_UI],
  ["focus-ring", "bg-sidebar", LARGE_OR_UI],
  ["success", "bg-sidebar", LARGE_OR_UI],
  ["success", "mesa-surface", LARGE_OR_UI],
  // Cor do personagem: anel de quem fala (borda) e total da rolagem (28px bold, texto grande).
  ...[1, 2, 3, 4, 5, 6].flatMap((i): Array<[string, string, number]> => [
    [`player-${i}`, "bg-sidebar", LARGE_OR_UI],
    [`player-${i}`, "mesa-surface", LARGE_OR_UI],
    [`player-${i}`, "chat-ingame", LARGE_OR_UI],
  ]),
];

describe.each<Theme>(["dark", "light"])("contraste no tema %s", (theme) => {
  it.each(pairs)("%s sobre %s ≥ %d:1", (fg, bg, min) => {
    expect(contrast(color(fg, theme), color(bg, theme))).toBeGreaterThanOrEqual(min);
  });
});

/**
 * Lacunas conhecidas, para o design decidir. Este teste falha quando uma delas for corrigida,
 * para lembrar de mover a combinação para a lista de cima.
 */
const knownGaps: Array<[Theme, string, string, number]> = [
  // Nome do personagem em texto pequeno no chat ingame (tema claro).
  ["light", "player-1", "chat-ingame", TEXT],
  ["light", "player-2", "chat-ingame", TEXT],
  ["light", "player-3", "chat-ingame", TEXT],
  ["light", "player-4", "chat-ingame", TEXT],
  ["light", "player-6", "chat-ingame", TEXT],
  // Complemento da linha de canal ativa ("2 na sala") no tema claro.
  ["light", "text-faint", "bg-raised", TEXT],
];

describe("lacunas conhecidas de contraste", () => {
  it.each(knownGaps)("%s: %s sobre %s ainda < %d:1", (theme, fg, bg, min) => {
    expect(contrast(color(fg, theme), color(bg, theme))).toBeLessThan(min);
  });
});
