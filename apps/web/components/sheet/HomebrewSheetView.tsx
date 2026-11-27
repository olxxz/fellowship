"use client";

import { IconButton } from "@fellowship/ui";
import { fillFormula, type HbAbility, type HomebrewSheet } from "@/lib/sheets/homebrew";
import { NumberField, Resource, RollButton, Section, StringList, TextArea, TextField } from "./fields";
import styles from "./Sheet.module.sass";

type Roll = (formula: string, label: string) => void;

/** Ficha do homebrew do grupo. `roll` manda a rolagem para a mesa da campanha. */
export function HomebrewSheetView({ sheet, set, readOnly, roll }: { sheet: HomebrewSheet; set: (s: HomebrewSheet) => void; readOnly: boolean; roll?: Roll }) {
  const patch = (p: Partial<HomebrewSheet>) => set({ ...sheet, ...p });
  const ro = readOnly;

  return (
    <div className={styles.sheet}>
      <Section title="Personagem">
        <div className={styles.row}>
          <TextField label="Classe" value={sheet.classe} onChange={(classe) => patch({ classe })} readOnly={ro} />
          <TextField label="Tendência" value={sheet.tendencia} onChange={(tendencia) => patch({ tendencia })} readOnly={ro} />
          <NumberField label="Nível" value={sheet.nivel} onChange={(nivel) => patch({ nivel })} readOnly={ro} small />
        </div>
        <div className={styles.resources}>
          <Resource label="HP" atual={sheet.hp.atual} max={sheet.hp.max} color="var(--vital-hp)" readOnly={ro} onChange={(atual, max) => patch({ hp: { atual, max } })} />
          <Resource label="SP" atual={sheet.sp.atual} max={sheet.sp.max} color="var(--vital-mp, #5b8def)" readOnly={ro} onChange={(atual, max) => patch({ sp: { atual, max } })} />
          <Resource label="XP" atual={sheet.xp.atual} max={sheet.xp.max} color="var(--mesa-gold)" readOnly={ro} onChange={(atual, max) => patch({ xp: { atual, max } })} />
        </div>
      </Section>

      <Section title="Atributos">
        <TextField label="Fórmula dos testes" value={sheet.formulaTeste} onChange={(formulaTeste) => patch({ formulaTeste })} readOnly={ro} placeholder="1d20 + {total}" />
        <p className={styles.hint}>{"{total}"} = valor + bônus · {"{nivel}"} = nível do atributo. Toque no dado para rolar na mesa.</p>
        <div className={styles.attrGroups}>
          {sheet.atributos.map((g, gi) => (
            <div key={gi} className={styles.attrGroup}>
              <h4 className={styles.groupTitle}>{g.titulo}</h4>
              <div className={styles.attrHead} aria-hidden="true">
                <span>Atributo</span>
                <span>Nível</span>
                <span>Valor</span>
                <span>Bônus</span>
                <span>Total</span>
                <span />
              </div>
              {g.itens.map((a, ai) => {
                const total = a.valor + a.bonus;
                const upd = (p: Partial<typeof a>) =>
                  patch({ atributos: sheet.atributos.map((gg, x) => (x === gi ? { ...gg, itens: gg.itens.map((aa, y) => (y === ai ? { ...aa, ...p } : aa)) } : gg)) });
                return (
                  <div key={ai} className={styles.attrRow}>
                    <input className={styles.input} value={a.nome} readOnly={ro} aria-label="Atributo" onChange={(e) => upd({ nome: e.target.value })} />
                    <input className={`${styles.input} ${styles.number}`} type="number" value={a.nivel} readOnly={ro} aria-label={`Nível de ${a.nome}`} onChange={(e) => upd({ nivel: Number(e.target.value) })} />
                    <input className={`${styles.input} ${styles.number}`} type="number" value={a.valor} readOnly={ro} aria-label={`Valor de ${a.nome}`} onChange={(e) => upd({ valor: Number(e.target.value) })} />
                    <input className={`${styles.input} ${styles.number}`} type="number" value={a.bonus} readOnly={ro} aria-label={`Bônus de ${a.nome}`} onChange={(e) => upd({ bonus: Number(e.target.value) })} />
                    <strong className={styles.total}>{total}</strong>
                    <RollButton label={a.nome} onRoll={roll && (() => roll(fillFormula(sheet.formulaTeste, { total, nivel: a.nivel }), a.nome))} />
                  </div>
                );
              })}
              {!ro && (
                <button type="button" className={styles.addLink} onClick={() => patch({ atributos: sheet.atributos.map((gg, x) => (x === gi ? { ...gg, itens: [...gg.itens, { nome: "Novo", nivel: 0, valor: 0, bonus: 0 }] } : gg)) })}>
                  + atributo
                </button>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Habilidades"
        actions={!ro && <IconButton icon="plus" label="Nova habilidade" variant="ghost" onClick={() => patch({ habilidades: [...sheet.habilidades, { nome: "Nova habilidade", nivel: 0, max: 5, descricao: "", custo: "", formula: "" }] })} />}
      >
        {sheet.habilidades.length === 0 && <p className={styles.empty}>Nenhuma habilidade.</p>}
        {sheet.habilidades.map((h, i) => {
          const upd = (p: Partial<HbAbility>) => patch({ habilidades: sheet.habilidades.map((x, j) => (j === i ? { ...x, ...p } : x)) });
          return (
            <div key={i} className={styles.card}>
              <div className={styles.cardHead}>
                <input className={`${styles.input} ${styles.cardTitle}`} value={h.nome} readOnly={ro} aria-label="Nome da habilidade" onChange={(e) => upd({ nome: e.target.value })} />
                <span className={styles.levelPips} aria-label={`Nível ${h.nivel} de ${h.max}`}>
                  {Array.from({ length: Math.min(h.max, 20) }, (_, k) => (
                    <button key={k} type="button" disabled={ro} className={k < h.nivel ? styles.pipOn : styles.pip} onClick={() => upd({ nivel: k + 1 === h.nivel ? k : k + 1 })} aria-label={`Nível ${k + 1}`} />
                  ))}
                </span>
                {!ro && <IconButton icon="close" label="Tirar habilidade" variant="ghost" onClick={() => patch({ habilidades: sheet.habilidades.filter((_, j) => j !== i) })} />}
              </div>
              <div className={styles.row}>
                <NumberField label="Nível" value={h.nivel} onChange={(nivel) => upd({ nivel })} readOnly={ro} small />
                <NumberField label="Máx." value={h.max} onChange={(max) => upd({ max })} readOnly={ro} small />
                <TextField label="Custo" value={h.custo} onChange={(custo) => upd({ custo })} readOnly={ro} placeholder="Mana 10 x nível" />
                <div className={styles.formulaField}>
                  <TextField label="Fórmula" value={h.formula} onChange={(formula) => upd({ formula })} readOnly={ro} placeholder="1d6 x {hab}" />
                  {h.formula && <RollButton label={h.nome} onRoll={roll && (() => roll(fillFormula(h.formula, { nivel: sheet.nivel, hab: h.nivel }), h.nome))} />}
                </div>
              </div>
              <TextArea value={h.descricao} onChange={(descricao) => upd({ descricao })} readOnly={ro} rows={2} />
            </div>
          );
        })}
      </Section>

      <div className={styles.columns}>
        <Section title="Perícias">
          <StringList items={sheet.pericias} onChange={(pericias) => patch({ pericias })} readOnly={ro} placeholder="Perícia" />
        </Section>
        <Section title="Vantagens">
          <StringList items={sheet.vantagens} onChange={(vantagens) => patch({ vantagens })} readOnly={ro} placeholder="Vantagem" />
        </Section>
        <Section title="Desvantagens">
          <StringList items={sheet.desvantagens} onChange={(desvantagens) => patch({ desvantagens })} readOnly={ro} placeholder="Desvantagem" />
        </Section>
      </div>

      <Section title="Corpo">
        <div className={styles.slots}>
          {sheet.corpo.map((s, si) => (
            <div key={si} className={styles.slot}>
              <input className={`${styles.input} ${styles.slotName}`} value={s.slot} readOnly={ro} aria-label="Parte do corpo" onChange={(e) => patch({ corpo: sheet.corpo.map((x, j) => (j === si ? { ...x, slot: e.target.value } : x)) })} />
              {s.itens.map((it, ii) => {
                const updItem = (p: Partial<typeof it>) =>
                  patch({ corpo: sheet.corpo.map((x, j) => (j === si ? { ...x, itens: x.itens.map((y, k) => (k === ii ? { ...y, ...p } : y)) } : x)) });
                return (
                  <div key={ii} className={styles.slotItem}>
                    <input className={styles.input} value={it.nome} readOnly={ro} placeholder="Item" aria-label="Item" onChange={(e) => updItem({ nome: e.target.value })} />
                    <input className={`${styles.input} ${styles.effect}`} value={it.efeito} readOnly={ro} placeholder="Efeito" aria-label="Efeito" onChange={(e) => updItem({ efeito: e.target.value })} />
                    {!ro && <IconButton icon="close" label="Tirar item" variant="ghost" onClick={() => patch({ corpo: sheet.corpo.map((x, j) => (j === si ? { ...x, itens: x.itens.filter((_, k) => k !== ii) } : x)) })} />}
                  </div>
                );
              })}
              {!ro && (
                <button type="button" className={styles.addLink} onClick={() => patch({ corpo: sheet.corpo.map((x, j) => (j === si ? { ...x, itens: [...x.itens, { nome: "", efeito: "" }] } : x)) })}>
                  + item
                </button>
              )}
            </div>
          ))}
          {!ro && (
            <button type="button" className={styles.addLink} onClick={() => patch({ corpo: [...sheet.corpo, { slot: "Nova parte", itens: [] }] })}>
              + parte do corpo
            </button>
          )}
        </div>
      </Section>

      <div className={styles.columns}>
        <Section title="Mochila">
          <NumberField label="Dinheiro" value={sheet.dinheiro} onChange={(dinheiro) => patch({ dinheiro })} readOnly={ro} />
          <StringList items={sheet.mochila} onChange={(mochila) => patch({ mochila })} readOnly={ro} placeholder="Item" />
        </Section>
        <Section title="Kills">
          <StringList items={sheet.kills} onChange={(kills) => patch({ kills })} readOnly={ro} placeholder="Quem caiu" />
        </Section>
        <Section title="Deaths">
          <StringList items={sheet.deaths} onChange={(deaths) => patch({ deaths })} readOnly={ro} placeholder="Quem derrubou" />
        </Section>
      </div>

      <Section
        title="Armas e artefatos"
        actions={!ro && <IconButton icon="plus" label="Novo artefato" variant="ghost" onClick={() => patch({ artefatos: [...sheet.artefatos, { nome: "Novo artefato", descricao: "" }] })} />}
      >
        {sheet.artefatos.length === 0 && <p className={styles.empty}>Nenhum artefato.</p>}
        {sheet.artefatos.map((a, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.cardHead}>
              <input className={`${styles.input} ${styles.cardTitle}`} value={a.nome} readOnly={ro} aria-label="Nome do artefato" onChange={(e) => patch({ artefatos: sheet.artefatos.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })} />
              {!ro && <IconButton icon="close" label="Tirar artefato" variant="ghost" onClick={() => patch({ artefatos: sheet.artefatos.filter((_, j) => j !== i) })} />}
            </div>
            <TextArea value={a.descricao} onChange={(descricao) => patch({ artefatos: sheet.artefatos.map((x, j) => (j === i ? { ...x, descricao } : x)) })} readOnly={ro} rows={3} />
          </div>
        ))}
      </Section>

      <Section title="Notas">
        <TextArea value={sheet.notas} onChange={(notas) => patch({ notas })} readOnly={ro} rows={5} />
      </Section>
    </div>
  );
}
