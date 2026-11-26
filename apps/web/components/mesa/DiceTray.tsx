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
  // A cada rolagem, o dado do botão usado dá uma volta (a chave remonta só o ícone).
  const [rolled, setRolled] = useState<{ key: string; n: number }>({ key: "", n: 0 });

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
          <button
            key={sides}
            type="button"
            className={styles.die}
            onClick={() => {
              setRolled((r) => ({ key: `d${sides}`, n: r.n + 1 }));
              roll(withMod(`1d${sides}`));
            }}
            aria-label={`Rolar ${withMod(`1d${sides}`)}`}
          >
            <Icon key={rolled.key === `d${sides}` ? rolled.n : 0} name="dice" size={18} className={styles.dieIcon} motion={rolled.key === `d${sides}` ? "tumble" : undefined} />
            d{sides}
          </button>
        ))}
        <button
          type="button"
          className={styles.die}
          onClick={() => {
            setRolled((r) => ({ key: "vant", n: r.n + 1 }));
            roll(withMod("2d20kh1"));
          }}
          aria-label={`Rolar com vantagem: ${withMod("2d20kh1")}`}
        >
          <Icon key={rolled.key === "vant" ? rolled.n : 0} name="dice" size={18} className={styles.dieIcon} motion={rolled.key === "vant" ? "tumble" : undefined} />
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
          if (!formula.trim()) return;
          setRolled((r) => ({ key: "formula", n: r.n + 1 }));
          roll(formula);
        }}
      >
        <label htmlFor={formulaId} className={styles.label}>
          Fórmula
        </label>
        <input id={formulaId} className={styles.formula} value={formula} placeholder="2d20kh1 + 5" onChange={(e) => setFormula(e.target.value)} autoComplete="off" />
        <Button type="submit" variant="mesa" icon="dice" iconKey={rolled.key === "formula" ? rolled.n : 0} iconMotion={rolled.key === "formula" ? "tumble" : undefined}>
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
