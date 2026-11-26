"use client";

import { Avatar, Button, ResourceBar, playerColorStyle } from "@fellowship/ui";
import { useState } from "react";
import type { DemoCharacter } from "@/lib/demo/data";
import { skillFormula } from "@/lib/demo/dice";
import styles from "./CharacterSheet.module.sass";

export interface CharacterSheetProps {
  character: DemoCharacter;
  /** Rola um teste da ficha; o resultado vai para o chat ingame. */
  onRoll: (character: DemoCharacter, label: string, formula: string) => void;
  /** Mestre: troca entre as fichas da campanha. */
  choices?: DemoCharacter[];
  onChoose?: (id: string) => void;
}

/** Ficha do personagem a partir do template de exemplo: atributos, vida e mana, perícias que viram botão de rolar. */
export function CharacterSheet({ character, onRoll, choices, onChoose }: CharacterSheetProps) {
  const sheet = character.sheet;
  const [vitals, setVitals] = useState<Record<string, { hp: number; mana: number }>>({});
  // A cada rolagem, o dado da perícia rolada dá uma volta.
  const [rolled, setRolled] = useState<{ id: string; n: number }>({ id: "", n: 0 });
  if (!sheet) return <p className={styles.note}>Este personagem ainda não tem ficha.</p>;

  const current = vitals[character.id] ?? { hp: sheet.vitals.hp[0], mana: sheet.vitals.mana[0] };
  const setVital = (key: "hp" | "mana", value: number) => setVitals((all) => ({ ...all, [character.id]: { ...current, [key]: value } }));
  const attr = (id: string) => sheet.attributes.find((a) => a.id === id)?.value ?? 1;

  return (
    <div className={styles.sheet} style={playerColorStyle(character.color)}>
      {choices && onChoose && (
        <div className={styles.picker} role="group" aria-label="Fichas da campanha">
          {choices.map((c) => (
            <button key={c.id} type="button" className={styles.pick} style={playerColorStyle(c.color)} aria-pressed={c.id === character.id} onClick={() => onChoose(c.id)}>
              <Avatar name={c.name} color={c.color} appearance="ring" size={28} />
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className={styles.identity}>
        <Avatar name={character.name} color={character.color} appearance="ring" size={56} />
        <div>
          <h3 className={styles.name}>{character.name}</h3>
          <p className={styles.title}>{character.title}</p>
        </div>
      </div>

      <section className={styles.section} aria-label="Recursos">
        <ResourceBar label="Vida" tone="hp" value={current.hp} max={sheet.vitals.hp[1]} onChange={(v) => setVital("hp", v)} />
        <ResourceBar label="Mana" tone="mana" value={current.mana} max={sheet.vitals.mana[1]} onChange={(v) => setVital("mana", v)} />
      </section>

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Atributos</h4>
        <dl className={styles.attributes}>
          {sheet.attributes.map((a) => (
            <div key={a.id} className={styles.attribute}>
              <dt className={styles.attrLabel}>{a.label}</dt>
              <dd className={styles.attrValue} style={{ margin: 0 }}>
                {a.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Perícias</h4>
        <ul className={styles.skills}>
          {sheet.skills.map((s) => {
            const formula = skillFormula(attr(s.attribute), s.bonus);
            return (
              <li key={s.id} className={styles.skill}>
                <span className={styles.skillText}>
                  <span className={styles.skillName}>{s.label}</span>
                  <span className={styles.skillFormula}>{formula}</span>
                </span>
                <Button
                  variant="mesa"
                  icon="dice"
                  iconKey={rolled.id === s.id ? rolled.n : 0}
                  iconMotion={rolled.id === s.id ? "tumble" : undefined}
                  aria-label={`Rolar ${s.label}: ${formula}`}
                  onClick={() => {
                    setRolled((r) => ({ id: s.id, n: r.n + 1 }));
                    onRoll(character, s.label, formula);
                  }}
                >
                  Rolar
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Inventário</h4>
        <ul className={styles.inventory}>
          {sheet.inventory.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
