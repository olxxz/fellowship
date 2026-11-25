import type { CSSProperties } from "react";

/** Uma das seis cores de personagem (`player-1` … `player-6`). O Narrador usa 4 por padrão. */
export type PlayerColor = 1 | 2 | 3 | 4 | 5 | 6;

export const NARRATOR_COLOR: PlayerColor = 4;

/** Estilo inline que injeta `--player-color` no elemento, apontando para o token do tema atual. */
export function playerColorStyle(color: PlayerColor, style?: CSSProperties): CSSProperties {
  return { ...style, ["--player-color" as string]: `var(--player-${color})` };
}
