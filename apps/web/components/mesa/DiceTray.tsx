"use client";

import { Button, Icon, IconButton } from "@fellowship/ui";
import { useId, useState } from "react";
import { rollFormula } from "@/lib/demo/dice";
import styles from "./DiceTray.module.sass";

const QUICK = [4, 6, 8, 10, 12, 20, 100];

/** Bandeja de dados: dados rápidos, modificador, fórmula livre e (para o mestre) rolagem oculta. */
export function DiceTray({ master, onRoll }: { master: boolean; onRoll: (formula: string, hidden: boolean) => void }) {
  const [modifier, setModifier] = useState(0);
  const [formula, setFormula] = useState("");
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formulaId = useId();

  const withMod = (base: string) => (modifier ? `${base} ${modifier > 0 ? "+" : "-"} ${Math.abs(modifier)}` : base);

  function roll(f: string) {
    if (!rollFormula(f)) return setError("Não entendi a fórmula. Exemplos: 1d20+5, 2d20kh1 + 3, 3d6");
    setError(null);
    onRoll(f, master && hidden);
  }

  return (
    <div className={styles.tray}>
      <div className={styles.dice}>
        {QUICK.map((sides) => (
          <button key={sides} type="button" className={styles.die} onClick={() => roll(withMod(`1d${sides}`))} aria-label={`Rolar ${withMod(`1d${sides}`)}`}>
            <Icon name="dice" size={18} className={styles.dieIcon} />d{sides}
          </button>
        ))}
        <button type="button" className={styles.die} onClick={() => roll(withMod("2d20kh1"))} aria-label={`Rolar com vantagem: ${withMod("2d20kh1")}`}>
          <Icon name="dice" size={18} className={styles.dieIcon} />
          Vant.
        </button>
      </div>

      <div className={styles.row}>
        <span className={styles.label} id={`${formulaId}-mod`}>
          Modificador
        </span>
        <div className={styles.modifier} role="group" aria-labelledby={`${formulaId}-mod`}>
          <IconButton icon="minus" label="Diminuir modificador" onClick={() => setModifier((m) => m - 1)} />
          <span className={styles.modValue} aria-live="polite">
            {modifier > 0 ? `+${modifier}` : modifier}
          </span>
          <IconButton icon="plus" label="Aumentar modificador" onClick={() => setModifier((m) => m + 1)} />
        </div>
      </div>

      <form
        className={styles.row}
        onSubmit={(e) => {
          e.preventDefault();
          if (formula.trim()) roll(formula);
        }}
      >
        <label htmlFor={formulaId} className={styles.label}>
          Fórmula
        </label>
        <input id={formulaId} className={styles.formula} value={formula} placeholder="2d20kh1 + 5" onChange={(e) => setFormula(e.target.value)} autoComplete="off" />
        <Button type="submit" variant="mesa">
          Rolar
        </Button>
      </form>

      {master && (
        <label className={styles.check}>
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
          Rolagem oculta (só você vê o resultado)
        </label>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <p className={styles.note}>Protótipo: os dados rolam no navegador. No app de verdade, o servidor rola.</p>
    </div>
  );
}
