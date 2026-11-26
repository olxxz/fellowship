// Decisão do gesto de deslizar das barras laterais, separada do DOM para ser testável.
//
// 1. Trava de direção: só decide depois que o dedo andou SLOP px. É horizontal se |dx| > RATIO·|dy|
//    (ângulo menor que ~34° do eixo horizontal); senão é rolagem e o gesto é ignorado até soltar.
// 2. Compromisso ao soltar: abre/fecha se arrastou mais que COMMIT_FRACTION da largura da gaveta,
//    ou se soltou rápido (velocidade > COMMIT_VELOCITY px/ms) no sentido certo, mesmo com pouca distância.
// 3. A faixa EDGE px junto às bordas fica para o gesto de voltar do sistema (iPhone no Safari, Android).

export const SLOP = 10;
export const RATIO = 1.5;
export const COMMIT_FRACTION = 1 / 3;
export const COMMIT_VELOCITY = 0.45;
export const EDGE = 20;

export type Axis = "pending" | "horizontal" | "vertical";

/** Decide o eixo depois que o dedo andou o bastante. */
export function lockAxis(dx: number, dy: number): Axis {
  if (Math.hypot(dx, dy) < SLOP) return "pending";
  return Math.abs(dx) > RATIO * Math.abs(dy) ? "horizontal" : "vertical";
}

/** Começou na faixa reservada ao sistema? */
export function inSystemEdge(x: number, viewportWidth: number, edge = EDGE) {
  return x < edge || x > viewportWidth - edge;
}

export interface Sample {
  x: number;
  t: number;
}

/** Velocidade horizontal (px/ms) usando as amostras dos últimos ~100ms. */
export function velocity(samples: Sample[], windowMs = 100): number {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1]!;
  const first = samples.find((s) => last.t - s.t <= windowMs) ?? samples[0]!;
  const dt = last.t - first.t;
  return dt > 0 ? (last.x - first.x) / dt : 0;
}

/**
 * Ao soltar: o gesto se confirma? `direction` é +1 quando o gesto pede arrasto para a direita
 * (abrir a navegação, fechar membros) e −1 para a esquerda.
 */
export function shouldCommit(dx: number, v: number, width: number, direction: 1 | -1) {
  const distance = dx * direction;
  const speed = v * direction;
  if (distance <= 0) return false;
  return distance > width * COMMIT_FRACTION || speed > COMMIT_VELOCITY;
}
