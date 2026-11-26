import { describe, expect, it } from "vitest";
import { inSystemEdge, lockAxis, shouldCommit, velocity } from "./gesture";

describe("gesto das barras laterais", () => {
  it("espera o dedo andar antes de decidir", () => {
    expect(lockAxis(4, 3)).toBe("pending");
  });

  it("horizontal só quando claramente mais lateral que vertical", () => {
    expect(lockAxis(30, 10)).toBe("horizontal"); // ~18°
    expect(lockAxis(30, 25)).toBe("vertical"); // diagonal: rolando
    expect(lockAxis(-40, 20)).toBe("horizontal"); // 26°, para a esquerda
    expect(lockAxis(5, 40)).toBe("vertical");
  });

  it("reserva as bordas para o voltar do sistema", () => {
    expect(inSystemEdge(8, 390)).toBe(true);
    expect(inSystemEdge(385, 390)).toBe(true);
    expect(inSystemEdge(60, 390)).toBe(false);
  });

  it("confirma por distância ou por velocidade, no sentido certo", () => {
    expect(shouldCommit(120, 0.1, 300, 1)).toBe(true); // passou de 1/3
    expect(shouldCommit(40, 0.8, 300, 1)).toBe(true); // curto mas rápido
    expect(shouldCommit(40, 0.2, 300, 1)).toBe(false); // curto e lento: volta
    expect(shouldCommit(-150, -0.1, 300, 1)).toBe(false); // sentido errado
    expect(shouldCommit(-150, -0.1, 300, -1)).toBe(true);
  });

  it("calcula a velocidade com as amostras recentes", () => {
    const v = velocity([
      { x: 0, t: 0 },
      { x: 10, t: 150 },
      { x: 40, t: 200 },
      { x: 90, t: 250 },
    ]);
    expect(v).toBeCloseTo(0.8, 2); // (90 - 10) / (250 - 150)
  });
});
