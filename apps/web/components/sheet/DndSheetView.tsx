"use client";

import { IconButton } from "@fellowship/ui";
import { formulaFor, modifier, proficiency, saveBonus, score, signed, skillBonus, type DndSheet } from "@/lib/sheets/dnd";
import { defaultDndConfig, type DndConfig } from "@/lib/sheets/template";
import { NumberField, Resource, RollButton, Section, StringList, TextArea, TextField } from "./fields";
import styles from "./Sheet.module.sass";

type Roll = (formula: string, label: string) => void;

/** Ficha de D&D 5e (2024): modificadores, proficiência e perícias calculados a partir dos atributos e do nível. */
export function DndSheetView({ sheet, set, readOnly, roll, config = defaultDndConfig() }: { sheet: DndSheet; set: (s: DndSheet) => void; readOnly: boolean; roll?: Roll; config?: DndConfig }) {
  const { abilities, skills, sections: on } = config;
  const dexKey = abilities.find((a) => a.key === "des")?.key ?? abilities[1]?.key ?? abilities[0]?.key ?? "des";
  const perception = skills.find((sk) => sk.key === "percepcao");
  const patch = (p: Partial<DndSheet>) => set({ ...sheet, ...p });
  const ro = readOnly;
  const prof = proficiency(sheet.nivel);
  const init = modifier(score(sheet, dexKey));
  const passive = perception ? 10 + skillBonus(sheet, perception) : null;

  return (
    <div className={styles.sheet}>
      <Section title="Personagem">
        <div className={styles.row}>
          <TextField label="Classe" value={sheet.classe} onChange={(classe) => patch({ classe })} readOnly={ro} />
          <TextField label="Subclasse" value={sheet.subclasse} onChange={(subclasse) => patch({ subclasse })} readOnly={ro} />
          <NumberField label="Nível" value={sheet.nivel} onChange={(nivel) => patch({ nivel })} readOnly={ro} small />
        </div>
        <div className={styles.row}>
          <TextField label="Espécie" value={sheet.especie} onChange={(especie) => patch({ especie })} readOnly={ro} />
          <TextField label="Antecedente" value={sheet.antecedente} onChange={(antecedente) => patch({ antecedente })} readOnly={ro} />
          <TextField label="Alinhamento" value={sheet.alinhamento} onChange={(alinhamento) => patch({ alinhamento })} readOnly={ro} />
          <NumberField label="XP" value={sheet.xp} onChange={(xp) => patch({ xp })} readOnly={ro} />
        </div>
      </Section>

      {on.combate && (
      <Section title="Combate">
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.label}>CA</span>
            <input className={styles.statInput} type="number" value={sheet.ca} readOnly={ro} aria-label="Classe de armadura" onChange={(e) => patch({ ca: Number(e.target.value) })} />
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Iniciativa</span>
            <strong className={styles.statValue}>{signed(init)}</strong>
            <RollButton label="Iniciativa" onRoll={roll && (() => roll(formulaFor(init), "Iniciativa"))} />
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Deslocamento</span>
            <input className={styles.statInput} type="number" value={sheet.deslocamento} readOnly={ro} aria-label="Deslocamento em metros" onChange={(e) => patch({ deslocamento: Number(e.target.value) })} />
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Proficiência</span>
            <strong className={styles.statValue}>{signed(prof)}</strong>
          </div>
          {passive !== null && (
            <div className={styles.stat}>
              <span className={styles.label}>Percepção passiva</span>
              <strong className={styles.statValue}>{passive}</strong>
            </div>
          )}
          <label className={styles.stat}>
            <span className={styles.label}>Inspiração</span>
            <input type="checkbox" checked={sheet.inspiracao} disabled={ro} onChange={(e) => patch({ inspiracao: e.target.checked })} className={styles.check} />
          </label>
        </div>
        <div className={styles.resources}>
          <Resource label="Pontos de vida" atual={sheet.pv.atual} max={sheet.pv.max} color="var(--vital-hp)" readOnly={ro} onChange={(atual, max) => patch({ pv: { ...sheet.pv, atual, max } })} />
        </div>
        <div className={styles.row}>
          <NumberField label="PV temporários" value={sheet.pv.temp} onChange={(temp) => patch({ pv: { ...sheet.pv, temp } })} readOnly={ro} small />
          <TextField label="Dado de vida" value={sheet.dadosVida.tipo} onChange={(tipo) => patch({ dadosVida: { ...sheet.dadosVida, tipo } })} readOnly={ro} />
          <NumberField label="Restantes" value={sheet.dadosVida.restantes} onChange={(restantes) => patch({ dadosVida: { ...sheet.dadosVida, restantes } })} readOnly={ro} small />
          <NumberField label="Morte: sucessos" value={sheet.mortes.sucessos} onChange={(sucessos) => patch({ mortes: { ...sheet.mortes, sucessos } })} readOnly={ro} small />
          <NumberField label="Morte: falhas" value={sheet.mortes.falhas} onChange={(falhas) => patch({ mortes: { ...sheet.mortes, falhas } })} readOnly={ro} small />
        </div>
      </Section>
      )}

      <Section title={on.salvaguardas ? "Atributos e salvaguardas" : "Atributos"}>
        <div className={styles.abilities}>
          {abilities.map((a) => {
            const mod = modifier(score(sheet, a.key));
            const save = saveBonus(sheet, a.key);
            const proficient = sheet.salvaguardas.includes(a.key);
            return (
              <div key={a.key} className={styles.ability}>
                <span className={styles.label}>{a.nome}</span>
                <strong className={styles.abilityMod}>{signed(mod)}</strong>
                <input className={styles.abilityScore} type="number" value={score(sheet, a.key)} readOnly={ro} aria-label={`${a.nome} (valor)`} onChange={(e) => patch({ atributos: { ...sheet.atributos, [a.key]: Number(e.target.value) } })} />
                <div className={styles.abilityActions}>
                  <RollButton label={`Teste de ${a.nome}`} onRoll={roll && (() => roll(formulaFor(mod), `Teste de ${a.nome}`))} />
                  {on.salvaguardas && (<>
                  <label className={styles.saveToggle} title="Proficiente na salvaguarda">
                    <input
                      type="checkbox"
                      checked={proficient}
                      disabled={ro}
                      onChange={(e) => patch({ salvaguardas: e.target.checked ? [...sheet.salvaguardas, a.key] : sheet.salvaguardas.filter((k) => k !== a.key) })}
                    />
                    Salv. {signed(save)}
                  </label>
                  <RollButton label={`Salvaguarda de ${a.nome}`} onRoll={roll && (() => roll(formulaFor(save), `Salvaguarda de ${a.nome}`))} />
                  </>)}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {on.pericias && (
      <Section title="Perícias">
        <p className={styles.hint}>Toque no círculo: sem proficiência → proficiente → especialista.</p>
        <div className={styles.skills}>
          {skills.map((s) => {
            const level = sheet.pericias[s.key] ?? 0;
            const bonus = skillBonus(sheet, s);
            return (
              <div key={s.key} className={styles.skill}>
                <button
                  type="button"
                  className={`${styles.profDot} ${level === 1 ? styles.profOn : level === 2 ? styles.profExpert : ""}`}
                  disabled={ro}
                  aria-label={`${s.nome}: ${["sem proficiência", "proficiente", "especialista"][level]}`}
                  onClick={() => patch({ pericias: { ...sheet.pericias, [s.key]: ((level + 1) % 3) as 0 | 1 | 2 } })}
                />
                <span className={styles.skillName}>
                  {s.nome} <small>({s.attr.toUpperCase().slice(0, 3)})</small>
                </span>
                <strong>{signed(bonus)}</strong>
                <RollButton label={s.nome} onRoll={roll && (() => roll(formulaFor(bonus), s.nome))} />
              </div>
            );
          })}
        </div>
      </Section>
      )}

      {on.ataques && (
      <Section
        title="Ataques"
        actions={!ro && <IconButton icon="plus" label="Novo ataque" variant="ghost" onClick={() => patch({ ataques: [...sheet.ataques, { nome: "Novo ataque", bonus: prof + modifier(score(sheet, abilities[0]?.key ?? "for")), dano: "1d8+" + modifier(score(sheet, abilities[0]?.key ?? "for")), tipo: "cortante" }] })} />}
      >
        {sheet.ataques.length === 0 && <p className={styles.empty}>Nenhum ataque.</p>}
        {sheet.ataques.map((a, i) => {
          const upd = (p: Partial<typeof a>) => patch({ ataques: sheet.ataques.map((x, j) => (j === i ? { ...x, ...p } : x)) });
          return (
            <div key={i} className={styles.attackRow}>
              <input className={styles.input} value={a.nome} readOnly={ro} aria-label="Ataque" onChange={(e) => upd({ nome: e.target.value })} />
              <input className={`${styles.input} ${styles.number}`} type="number" value={a.bonus} readOnly={ro} aria-label="Bônus de ataque" onChange={(e) => upd({ bonus: Number(e.target.value) })} />
              <RollButton label={`Ataque: ${a.nome}`} onRoll={roll && (() => roll(formulaFor(a.bonus), `Ataque: ${a.nome}`))} />
              <input className={styles.input} value={a.dano} readOnly={ro} aria-label="Dano" onChange={(e) => upd({ dano: e.target.value })} />
              <RollButton label={`Dano: ${a.nome}`} onRoll={roll && a.dano ? () => roll(a.dano, `Dano: ${a.nome}`) : undefined} />
              <input className={styles.input} value={a.tipo} readOnly={ro} aria-label="Tipo de dano" onChange={(e) => upd({ tipo: e.target.value })} />
              {!ro && <IconButton icon="close" label="Tirar ataque" variant="ghost" onClick={() => patch({ ataques: sheet.ataques.filter((_, j) => j !== i) })} />}
            </div>
          );
        })}
      </Section>
      )}

      {on.magias && (
      <Section title="Magias">
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Atributo de conjuração</span>
            <select className={styles.input} value={sheet.magias.atributo} disabled={ro} onChange={(e) => patch({ magias: { ...sheet.magias, atributo: e.target.value } })}>
              {abilities.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.stat}>
            <span className={styles.label}>CD de magia</span>
            <strong className={styles.statValue}>{8 + prof + modifier(score(sheet, sheet.magias.atributo))}</strong>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Ataque mágico</span>
            <strong className={styles.statValue}>{signed(prof + modifier(score(sheet, sheet.magias.atributo)))}</strong>
            <RollButton label="Ataque mágico" onRoll={roll && (() => roll(formulaFor(prof + modifier(score(sheet, sheet.magias.atributo))), "Ataque mágico"))} />
          </div>
        </div>
        <div className={styles.slotsRow}>
          {sheet.magias.espacos.map((e, i) => (
            <label key={i} className={styles.spellSlot}>
              <span className={styles.label}>{i + 1}º</span>
              <input type="number" value={e.usados} readOnly={ro} aria-label={`Espaços de ${i + 1}º círculo usados`} onChange={(ev) => patch({ magias: { ...sheet.magias, espacos: sheet.magias.espacos.map((x, j) => (j === i ? { ...x, usados: Number(ev.target.value) } : x)) } })} />
              <span>/</span>
              <input type="number" value={e.max} readOnly={ro} aria-label={`Espaços de ${i + 1}º círculo`} onChange={(ev) => patch({ magias: { ...sheet.magias, espacos: sheet.magias.espacos.map((x, j) => (j === i ? { ...x, max: Number(ev.target.value) } : x)) } })} />
            </label>
          ))}
        </div>
        {sheet.magias.lista.map((m, i) => {
          const upd = (p: Partial<typeof m>) => patch({ magias: { ...sheet.magias, lista: sheet.magias.lista.map((x, j) => (j === i ? { ...x, ...p } : x)) } });
          return (
            <div key={i} className={styles.card}>
              <div className={styles.cardHead}>
                <input className={`${styles.input} ${styles.cardTitle}`} value={m.nome} readOnly={ro} aria-label="Magia" onChange={(e) => upd({ nome: e.target.value })} />
                <NumberField label="Círculo" value={m.nivel} onChange={(nivel) => upd({ nivel })} readOnly={ro} small />
                <label className={styles.saveToggle}>
                  <input type="checkbox" checked={m.preparada} disabled={ro} onChange={(e) => upd({ preparada: e.target.checked })} />
                  Preparada
                </label>
                {!ro && <IconButton icon="close" label="Tirar magia" variant="ghost" onClick={() => patch({ magias: { ...sheet.magias, lista: sheet.magias.lista.filter((_, j) => j !== i) } })} />}
              </div>
              <TextArea value={m.descricao} onChange={(descricao) => upd({ descricao })} readOnly={ro} rows={2} />
            </div>
          );
        })}
        {!ro && (
          <button type="button" className={styles.addLink} onClick={() => patch({ magias: { ...sheet.magias, lista: [...sheet.magias.lista, { nome: "Nova magia", nivel: 0, preparada: false, descricao: "" }] } })}>
            + magia
          </button>
        )}
      </Section>
      )}

      <div className={styles.columns}>
        {on.caracteristicas && (
        <Section title="Características e talentos">
          {sheet.caracteristicas.map((c, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardHead}>
                <input className={`${styles.input} ${styles.cardTitle}`} value={c.nome} readOnly={ro} aria-label="Característica" onChange={(e) => patch({ caracteristicas: sheet.caracteristicas.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })} />
                {!ro && <IconButton icon="close" label="Tirar" variant="ghost" onClick={() => patch({ caracteristicas: sheet.caracteristicas.filter((_, j) => j !== i) })} />}
              </div>
              <TextArea value={c.descricao} onChange={(descricao) => patch({ caracteristicas: sheet.caracteristicas.map((x, j) => (j === i ? { ...x, descricao } : x)) })} readOnly={ro} rows={2} />
            </div>
          ))}
          {!ro && (
            <button type="button" className={styles.addLink} onClick={() => patch({ caracteristicas: [...sheet.caracteristicas, { nome: "Nova característica", descricao: "" }] })}>
              + característica
            </button>
          )}
        </Section>
        )}
        {on.equipamento && (
        <Section title="Equipamento">
          <div className={styles.coins}>
            {(["pc", "pp", "pe", "po", "pl"] as const).map((k) => (
              <NumberField key={k} label={k.toUpperCase()} value={sheet.moedas[k]} onChange={(v) => patch({ moedas: { ...sheet.moedas, [k]: v } })} readOnly={ro} small />
            ))}
          </div>
          <StringList items={sheet.equipamento} onChange={(equipamento) => patch({ equipamento })} readOnly={ro} placeholder="Item" />
        </Section>
        )}
      </div>

      {on.notas && (
      <Section title="Proficiências, idiomas e notas">
        <TextArea label="Proficiências (armas, armaduras, ferramentas)" value={sheet.proficiencias} onChange={(proficiencias) => patch({ proficiencias })} readOnly={ro} rows={2} />
        <TextArea label="Idiomas" value={sheet.idiomas} onChange={(idiomas) => patch({ idiomas })} readOnly={ro} rows={1} />
        <TextArea label="Notas" value={sheet.notas} onChange={(notas) => patch({ notas })} readOnly={ro} rows={4} />
      </Section>
      )}
    </div>
  );
}
