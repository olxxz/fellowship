import { describe, expect, it } from "vitest";
import { rollFormula, skillFormula } from "./dice";

/** Gerador que devolve, em ordem, os valores pedidos para dados de `sides` lados. */
const fixed = (sides: number, ...values: number[]) => {
  let i = 0;
  return () => (values[i++ % values.length]! - 1) / sides;
};

describe("rollFormula (demo)", () => {
  it("soma dado e modificador e normaliza a fórmula", () => {
    expect(rollFormula("1d20+4", fixed(20, 15))).toEqual({ formula: "1d20 + 4", dice: [{ value: 15 }], modifier: 4, total: 19 });
  });

  it("vantagem descarta o menor", () => {
    const r = rollFormula("2d20kh1 + 5", fixed(20, 9, 17));
    expect(r?.dice).toEqual([{ value: 9, discarded: true }, { value: 17 }]);
    expect(r?.total).toBe(22);
  });

  it("marca 20 natural e 1 natural", () => {
    expect(rollFormula("1d20", fixed(20, 20))?.critical).toEqual({ kind: "success", label: "20 natural" });
    expect(rollFormula("1d20+3", fixed(20, 1))?.critical).toEqual({ kind: "failure", label: "1 natural" });
    expect(rollFormula("3d6", fixed(6, 6))?.critical).toBeUndefined();
  });

  it("aceita d sem quantidade, subtração e vários grupos", () => {
    const r = rollFormula("d6 + 1d4 - 1", fixed(6, 3, 2));
    expect(r?.formula).toBe("1d6 + 1d4 - 1");
    expect(r?.modifier).toBe(-1);
  });

  it("recusa fórmulas inválidas ou exageradas", () => {
    for (const bad of ["", "abc", "1d", "2d20kh3", "1000d6", "1d20 5", "1d1"]) expect(rollFormula(bad)).toBeNull();
  });
});

describe("skillFormula", () => {
  it("usa o atributo como quantidade de d20", () => {
    expect(skillFormula(3, 5)).toBe("3d20kh1 + 5");
    expect(skillFormula(1, 0)).toBe("1d20");
  });
});
