import type { CSSProperties } from "react";

/** Uma das seis cores de personagem (`player-1` … `player-6`), que mudam com o tema. O Narrador usa 4 por padrão. */
export type PlayerColor = 1 | 2 | 3 | 4 | 5 | 6;

/** Cor de identidade: uma das cores de personagem do tema, ou uma cor livre em hex (#rrggbb) escolhida pela pessoa. */
export type AccentColor = PlayerColor | string;

export const NARRATOR_COLOR: PlayerColor = 4;

/** Cores sugeridas no seletor. As seis primeiras são as cores de personagem do tema escuro. */
export const PRESET_COLORS: ReadonlyArray<{ hex: string; name: string }> = [
  { hex: "#4fb3a9", name: "Verde-água" },
  { hex: "#e07a5f", name: "Coral" },
  { hex: "#a99cf5", name: "Lilás" },
  { hex: "#d4a24c", name: "Ouro" },
  { hex: "#5b8def", name: "Azul" },
  { hex: "#7ee0a1", name: "Verde" },
  { hex: "#ff6b9d", name: "Rosa" },
  { hex: "#e05a5a", name: "Vermelho" },
  { hex: "#f2994a", name: "Laranja" },
  { hex: "#f2c94c", name: "Amarelo" },
  { hex: "#56ccf2", name: "Ciano" },
  { hex: "#9b9ba5", name: "Cinza" },
];

const HEX = /^#[0-9a-f]{6}$/i;
export const isHexColor = (value: string) => HEX.test(value);

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

const DARK = "#0e0f12";
const LIGHT = "#ffffff";

/** Texto legível sobre uma cor livre: escuro ou branco, o que tiver mais contraste (WCAG). */
export function readableOn(hex: string): string {
  if (!isHexColor(hex)) return DARK;
  const l = luminance(hex);
  return (l + 0.05) / (0.05 + luminance(DARK)) >= (1.05) / (l + 0.05) ? DARK : LIGHT;
}

/**
 * Estilo inline que injeta `--player-color` e `--player-color-contrast` no elemento.
 * Com uma cor de personagem, aponta para o token do tema atual; com hex, usa a cor livre e calcula o texto por cima.
 */
export function playerColorStyle(color: AccentColor, style?: CSSProperties): CSSProperties {
  if (typeof color === "number") {
    return { ...style, ["--player-color" as string]: `var(--player-${color})`, ["--player-color-contrast" as string]: DARK };
  }
  const hex = isHexColor(color) ? color.toLowerCase() : "#9b9ba5";
  return { ...style, ["--player-color" as string]: hex, ["--player-color-contrast" as string]: readableOn(hex) };
}
