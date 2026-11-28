import { describe, expect, it } from "vitest";
import { choose, startAdventure, validateAdventure, visibleChoices, type Adventure } from "./adventure";

const mini: Adventure = {
  id: "t",
  titulo: "Teste",
  resumo: "",
  autor: "",
  duracao: 1,
  genero: "",
  sigla: "T",
  cor: "#000000",
  inicio: "a",
  derrota: "morte",
  vida: 3,
  stats: [{ key: "forca", nome: "Força", valor: 2 }],
  itens: { chave: "Chave" },
  cenas: {
    a: { titulo: "A", texto: "", efeitos: [{ item: "chave" }], escolhas: [{ texto: "Porta", ir: "b", precisa: { item: "chave" } }, { texto: "Pular", teste: { stat: "forca", cd: 10, sucesso: "fim", falha: "a", efeitosFalha: [{ vida: -2 }] } }] },
    b: { titulo: "B", texto: "", escolhas: [{ texto: "Ir", ir: "fim" }] },
    fim: { titulo: "Fim", texto: "", fim: "vitoria" },
    morte: { titulo: "Morte", texto: "", fim: "derrota" },
  },
};

describe("aventura", () => {
  it("valida uma aventura correta", () => expect(validateAdventure(mini)).toEqual([]));

  it("acha link quebrado, cena inalcançável, beco sem saída e item que ninguém dá", () => {
    const bad: Adventure = {
      ...mini,
      cenas: { ...mini.cenas, a: { titulo: "A", texto: "", escolhas: [{ texto: "x", ir: "nada" }, { texto: "y", ir: "b", precisa: { item: "joia" } }] }, solta: { titulo: "S", texto: "" } },
    };
    const errors = validateAdventure(bad).join("\n");
    expect(errors).toMatch(/"nada" não existe/);
    expect(errors).toMatch(/item "joia", que nenhuma cena dá/);
    expect(errors).toMatch(/"solta" não tem saída/);
    expect(errors).toMatch(/"solta" não é alcançável/);
  });

  it("joga: efeitos, condições, teste com dado e derrota ao zerar a vida", () => {
    let s = startAdventure(mini);
    expect(s.itens).toEqual(["chave"]);
    expect(visibleChoices(mini, s).map((c) => c.texto)).toEqual(["Porta", "Pular"]);
    const pular = mini.cenas.a!.escolhas![1]!;
    const r1 = choose(mini, s, pular, 5); // 5 + 2 < 10: falha, perde 2
    expect(r1.check).toMatchObject({ total: 7, ok: false });
    expect(r1.state).toMatchObject({ cena: "a", vida: 1 });
    const r2 = choose(mini, r1.state, pular, 3); // falha de novo: vida -1 → derrota
    expect(r2.state.cena).toBe("morte");
    s = choose(mini, startAdventure(mini), pular, 8).state; // 10: passa
    expect(s.cena).toBe("fim");
  });
});
