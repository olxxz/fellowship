// Rolagem de dados: interpreta a fórmula e sorteia. O sorteio de verdade acontece no servidor
// (rota /api/rolar, com crypto); o navegador só mostra o resultado gravado.
//
// Fórmulas aceitas: "1d20+5", "2d20kh1 + 4", "4d6dl1", "1d6 x 3", "1d20 / 2", "(1d8+2)*2", "d%".
// kh/kl = manter os N maiores/menores; dh/dl = descartar os N maiores/menores. "x" ou "*" multiplica;
// "/" divide e arredonda para baixo.

export interface RolledDie {
  value: number;
  sides: number;
  /** Fora da soma (kh/kl/dh/dl). */
  discarded?: boolean;
}

export interface RollResult {
  /** Fórmula normalizada para mostrar ("2d20kh1 + 5"). */
  formula: string;
  total: number;
  dice: RolledDie[];
  /** Total menos a soma dos dados mantidos (o "+ 5" do cartão). */
  modifier: number;
  critical?: { kind: "success" | "failure"; label: string };
}

export class DiceError extends Error {}

const MAX_DICE = 100;
const MAX_SIDES = 1000;
const MAX_LENGTH = 120;

type Random = (sides: number) => number;
const defaultRandom: Random = (sides) => 1 + Math.floor(Math.random() * sides);

/** Rola a fórmula. `random(sides)` deve devolver um inteiro de 1 a sides (no servidor, crypto.randomInt). */
export function roll(input: string, random: Random = defaultRandom): RollResult {
  const source = input.toLowerCase().replace(/\s+/g, " ").trim();
  if (!source) throw new DiceError("Escreva uma fórmula, como 1d20+5.");
  if (source.length > MAX_LENGTH) throw new DiceError("Fórmula longa demais.");
  // "1d20 5" é erro de digitação, não "1d205".
  if (/\d\s+\d/.test(source)) throw new DiceError("Falta um sinal entre os números.");

  const s = source.replace(/\s+/g, "");
  let pos = 0;
  const dice: RolledDie[] = [];
  let totalDiceGroups = 0;
  let d20Kept: number[] | null = null;
  let diceCount = 0;

  const peek = () => s[pos];
  const eat = (c: string) => {
    if (s[pos] === c) {
      pos++;
      return true;
    }
    return false;
  };
  const number = () => {
    const start = pos;
    while (pos < s.length && /\d/.test(s[pos]!)) pos++;
    return start === pos ? null : Number(s.slice(start, pos));
  };

  function factor(): { value: number; text: string } {
    if (eat("(")) {
      const inner = expr();
      if (!eat(")")) throw new DiceError("Falta fechar o parêntese.");
      return { value: inner.value, text: `(${inner.text})` };
    }
    if (eat("-")) {
      const f = factor();
      return { value: -f.value, text: `-${f.text}` };
    }
    const start = pos;
    const count = number();
    if (peek() === "d") {
      pos++;
      let sides: number | null;
      if (eat("%")) sides = 100;
      else sides = number();
      if (sides === null) throw new DiceError("Falta o número de lados do dado (ex.: d20).");
      const n = count ?? 1;
      if (n < 1 || n > MAX_DICE) throw new DiceError(`De 1 a ${MAX_DICE} dados por vez.`);
      if (sides < 2 || sides > MAX_SIDES) throw new DiceError(`Dados de 2 a ${MAX_SIDES} lados.`);
      diceCount += n;
      if (diceCount > MAX_DICE) throw new DiceError(`No máximo ${MAX_DICE} dados por rolagem.`);
      let mode: string | null = null;
      let k = 0;
      const m = s.slice(pos).match(/^(kh|kl|dh|dl|k|d)(\d+)/);
      if (m) {
        mode = m[1] === "k" ? "kh" : m[1] === "d" ? "dl" : m[1]!;
        k = Number(m[2]);
        pos += m[0].length;
        if (k < 1 || k > n) throw new DiceError("Quantidade de dados para manter/descartar inválida.");
      }
      const values = Array.from({ length: n }, () => random(sides!));
      const order = values.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
      const dropped = new Set<number>();
      if (mode === "kh") order.slice(0, n - k).forEach(([, i]) => dropped.add(i));
      if (mode === "kl") order.slice(k).forEach(([, i]) => dropped.add(i));
      if (mode === "dl") order.slice(0, k).forEach(([, i]) => dropped.add(i));
      if (mode === "dh") order.slice(n - k).forEach(([, i]) => dropped.add(i));
      let sum = 0;
      values.forEach((value, i) => {
        const discarded = dropped.has(i);
        dice.push(discarded ? { value, sides: sides!, discarded } : { value, sides: sides! });
        if (!discarded) sum += value;
      });
      totalDiceGroups++;
      if (sides === 20) d20Kept = values.filter((_, i) => !dropped.has(i));
      return { value: sum, text: s.slice(start, pos) };
    }
    if (count === null) throw new DiceError(pos < s.length ? `Não entendi "${s[pos]}".` : "A fórmula terminou no meio.");
    return { value: count, text: String(count) };
  }

  function term(): { value: number; text: string } {
    let left = factor();
    for (;;) {
      if (eat("*") || eat("x") || eat("×")) {
        const right = factor();
        left = { value: left.value * right.value, text: `${left.text} × ${right.text}` };
      } else if (eat("/")) {
        const right = factor();
        if (right.value === 0) throw new DiceError("Divisão por zero.");
        left = { value: Math.floor(left.value / right.value), text: `${left.text} / ${right.text}` };
      } else return left;
    }
  }

  function expr(): { value: number; text: string } {
    let left = term();
    for (;;) {
      if (eat("+")) {
        const right = term();
        left = { value: left.value + right.value, text: `${left.text} + ${right.text}` };
      } else if (eat("-")) {
        const right = term();
        left = { value: left.value - right.value, text: `${left.text} - ${right.text}` };
      } else return left;
    }
  }

  const result = expr();
  if (pos !== s.length) throw new DiceError(`Não entendi "${s.slice(pos)}".`);
  if (!dice.length) throw new DiceError("Inclua ao menos um dado (ex.: 1d20).");

  const keptSum = dice.filter((d) => !d.discarded).reduce((a, d) => a + d.value, 0);
  let critical: RollResult["critical"];
  const kept = d20Kept as number[] | null;
  if (totalDiceGroups === 1 && kept && kept.length === 1) {
    if (kept[0] === 20) critical = { kind: "success", label: "20 natural" };
    if (kept[0] === 1) critical = { kind: "failure", label: "1 natural" };
  }
  return { formula: result.text, total: result.value, dice, modifier: result.value - keptSum, ...(critical ? { critical } : {}) };
}
