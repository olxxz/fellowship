import { describe, expect, it } from "vitest";
import { DiceError, roll } from "./dice";

/** Sorteio previsível: devolve os valores em sequência. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

describe("roll", () => {
  it("soma dados e modificadores", () => {
    const r = roll("1d20 + 5", seq(12));
    expect(r).toMatchObject({ total: 17, modifier: 5, formula: "1d20 + 5" });
    expect(r.dice).toEqual([{ value: 12, sides: 20 }]);
  });

  it("vantagem: mantém o maior; 4d6 descartando o menor", () => {
    const adv = roll("2d20kh1+3", seq(7, 15));
    expect(adv.total).toBe(18);
    expect(adv.dice).toEqual([{ value: 7, sides: 20, discarded: true }, { value: 15, sides: 20 }]);
    expect(roll("4d6dl1", seq(1, 4, 6, 3)).total).toBe(13);
    expect(roll("2d20kl1", seq(7, 15)).total).toBe(7);
  });

  it("multiplica (x ou *) e divide arredondando para baixo, com parênteses", () => {
    expect(roll("1d6 x 3", seq(4)).total).toBe(12);
    expect(roll("1d20 / 2", seq(7)).total).toBe(3);
    expect(roll("(1d8+2)*2", seq(5)).total).toBe(14);
    expect(roll("d%", seq(42)).total).toBe(42);
  });

  it("marca 20 e 1 naturais num único d20", () => {
    expect(roll("1d20+2", seq(20)).critical).toEqual({ kind: "success", label: "20 natural" });
    expect(roll("1d20+2", seq(1)).critical).toEqual({ kind: "failure", label: "1 natural" });
    expect(roll("2d20kh1", seq(20, 3)).critical?.kind).toBe("success");
    expect(roll("1d20+1d4", seq(20, 2)).critical).toBeUndefined();
  });

  it("recusa fórmulas inválidas ou exageradas", () => {
    for (const bad of ["", "1d20 5", "abc", "1d", "1d20+", "101d6", "1d1", "(1d6", "1d6/0", "2d6kh3", "10"]) {
      expect(() => roll(bad, seq(1)), bad).toThrow(DiceError);
    }
  });
});
