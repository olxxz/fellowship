import { describe, expect, it } from "vitest";
import { importHomebrewMarkdown } from "./import-md";

// Ficha de exemplo no formato do Obsidian (a do Bjørn, sem as imagens).
const MD = `# Bjørn Edgardson  
> **Classe:** Bárbaro  
> 
> **Tendência:** Caótico Bom  
  
## Status  
> ### HP: 146 / 141  
> 
> ### SP: 140 / 110  
  
> ### Nível: 8  
> 
> ### XP: 800 / 200  
  
## Atributos  
### Físicos  

| Força         | 4                 \\|          8 + 4    |
| ------------- | -------------------------------------- |
| Destreza      | 2                 \\|         4 + 10    |
| Agilidade     | 3                 \\|                 3 |
  
### Mentais  

| Percepção   | 4                 \\|               10  |
| ----------- | -------------------------------------- |
| Carisma     | 2                 \\|         3 + 14    |
  
## Habilidades  
* Ataque de Fúria  3 / 5  -  
+ 2 de força x nível  
Mana 10 x nível  
  
* Arremesso  2 / 5  -  
1d6 x nível de dano em área e arremessa o inimigo 1d6 metros de distância  
Mana 10 x nível  
  
## Perícias  
Artilharia - Int  
Combate - +2 força x nvl 2  
  
## Vantagens e Desvantagens  
Xamã  
Duro de Matar  
  
Fanático  
Cabeça Quente  
  
## Corpo  
* Cabeça - Brincos de Fogo  
* Armadura -  
* Dedos   
    - Anel da Potência   
        * ( - 1/2 HP -> + niv x d20 de SP )  
    - Anel da Destreza  
        * + 10 DEX  
* Mainhand - Martelo de Guerra Ancestral  
  
## Mochila  
- Dinheiro: 107  
1. Martelo Normal  
2. Esmeralda  
  
## K/D  
> ### Kills  
> 
> 1. Lobo  
> 
> 2. Bestial  
  
> ### Deaths  
> 
> 1. Lady Saphira  
##   
## Armas e Artefatos  
> ### Martelo de Guerra Ancestral  
> 
> Dano = 34  
> 
> - 18 - 20 = Crítico  
> 
> ![Imagem](Attachments/x.jpeg)  
`;

describe("importHomebrewMarkdown", () => {
  const { name, sheet } = importHomebrewMarkdown(MD);

  it("cabeçalho e status", () => {
    expect(name).toBe("Bjørn Edgardson");
    expect(sheet).toMatchObject({ classe: "Bárbaro", tendencia: "Caótico Bom", nivel: 8, hp: { atual: 146, max: 141 }, sp: { atual: 140, max: 110 }, xp: { atual: 800, max: 200 } });
  });

  it("atributos em grupos com nível, valor e bônus", () => {
    expect(sheet.atributos.map((g) => g.titulo)).toEqual(["Físicos", "Mentais"]);
    expect(sheet.atributos[0]!.itens[0]).toEqual({ nome: "Força", nivel: 4, valor: 8, bonus: 4 });
    expect(sheet.atributos[0]!.itens[2]).toEqual({ nome: "Agilidade", nivel: 3, valor: 3, bonus: 0 });
    expect(sheet.atributos[1]!.itens[1]).toEqual({ nome: "Carisma", nivel: 2, valor: 3, bonus: 14 });
  });

  it("habilidades com nível, custo e fórmula de dano", () => {
    expect(sheet.habilidades).toHaveLength(2);
    expect(sheet.habilidades[0]).toMatchObject({ nome: "Ataque de Fúria", nivel: 3, max: 5, custo: "Mana 10 x nível" });
    expect(sheet.habilidades[1]!.formula).toBe("1d6");
  });

  it("perícias, vantagens e desvantagens separadas pela linha em branco", () => {
    expect(sheet.pericias).toEqual(["Artilharia - Int", "Combate - +2 força x nvl 2"]);
    expect(sheet.vantagens).toEqual(["Xamã", "Duro de Matar"]);
    expect(sheet.desvantagens).toEqual(["Fanático", "Cabeça Quente"]);
  });

  it("corpo com itens e efeitos, mochila, K/D e artefatos", () => {
    expect(sheet.corpo.find((s) => s.slot === "Cabeça")!.itens).toEqual([{ nome: "Brincos de Fogo", efeito: "" }]);
    const dedos = sheet.corpo.find((s) => s.slot === "Dedos")!;
    expect(dedos.itens.map((i) => i.nome)).toEqual(["Anel da Potência", "Anel da Destreza"]);
    expect(dedos.itens[1]!.efeito).toContain("+ 10 DEX");
    expect(sheet.dinheiro).toBe(107);
    expect(sheet.mochila).toEqual(["Martelo Normal", "Esmeralda"]);
    expect(sheet.kills).toEqual(["Lobo", "Bestial"]);
    expect(sheet.deaths).toEqual(["Lady Saphira"]);
    expect(sheet.artefatos[0]!.nome).toBe("Martelo de Guerra Ancestral");
    expect(sheet.artefatos[0]!.descricao).toContain("Dano = 34");
  });
});
