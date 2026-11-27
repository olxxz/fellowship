"use client";

import { Icon, IconButton } from "@fellowship/ui";
import { useState, type ReactNode } from "react";
import styles from "./Sheet.module.sass";

// Peças da ficha: tudo edita no lugar (sem botão de salvar; a ficha salva sozinha).

export function Section({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className={styles.section}>
      <header className={styles.sectionHead}>
        <button type="button" className={styles.sectionToggle} aria-expanded={open} onClick={() => setOpen(!open)}>
          <Icon name="chevronDown" size={14} className={open ? undefined : styles.closed} />
          {title}
        </button>
        {actions}
      </header>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </section>
  );
}

export function TextField({ label, value, onChange, readOnly, placeholder, wide }: { label?: string; value: string; onChange: (v: string) => void; readOnly?: boolean; placeholder?: string; wide?: boolean }) {
  return (
    <label className={`${styles.field} ${wide ? styles.wide : ""}`}>
      {label && <span className={styles.label}>{label}</span>}
      <input className={styles.input} value={value} readOnly={readOnly} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function NumberField({ label, value, onChange, readOnly, small }: { label?: string; value: number; onChange: (v: number) => void; readOnly?: boolean; small?: boolean }) {
  return (
    <label className={`${styles.field} ${small ? styles.small : ""}`}>
      {label && <span className={styles.label}>{label}</span>}
      <input
        className={`${styles.input} ${styles.number}`}
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : 0}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      />
    </label>
  );
}

export function TextArea({ label, value, onChange, readOnly, rows = 3 }: { label?: string; value: string; onChange: (v: string) => void; readOnly?: boolean; rows?: number }) {
  return (
    <label className={`${styles.field} ${styles.wide}`}>
      {label && <span className={styles.label}>{label}</span>}
      <textarea className={styles.textarea} rows={rows} value={value} readOnly={readOnly} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/** Recurso com atual/máximo, barra e botões de − e +. */
export function Resource({ label, atual, max, color, onChange, readOnly }: { label: string; atual: number; max: number; color: string; onChange: (atual: number, max: number) => void; readOnly?: boolean }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0;
  return (
    <div className={styles.resource} style={{ ["--res" as string]: color }}>
      <div className={styles.resourceHead}>
        <span className={styles.label}>{label}</span>
        <span className={styles.resourceValues}>
          {!readOnly && <IconButton icon="minus" label={`Diminuir ${label}`} variant="ghost" onClick={() => onChange(atual - 1, max)} />}
          <input className={styles.resourceInput} type="number" value={atual} readOnly={readOnly} aria-label={`${label} atual`} onChange={(e) => onChange(Number(e.target.value), max)} />
          <span>/</span>
          <input className={styles.resourceInput} type="number" value={max} readOnly={readOnly} aria-label={`${label} máximo`} onChange={(e) => onChange(atual, Number(e.target.value))} />
          {!readOnly && <IconButton icon="plus" label={`Aumentar ${label}`} variant="ghost" onClick={() => onChange(atual + 1, max)} />}
        </span>
      </div>
      <div className={styles.bar} aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Lista de textos (vantagens, mochila, kills…): adicionar, editar, tirar. */
export function StringList({ items, onChange, readOnly, placeholder }: { items: string[]; onChange: (v: string[]) => void; readOnly?: boolean; placeholder: string }) {
  const [draft, setDraft] = useState("");
  return (
    <div className={styles.list}>
      {items.length === 0 && readOnly && <p className={styles.empty}>Nada aqui.</p>}
      {items.map((it, i) => (
        <div key={i} className={styles.listRow}>
          <input className={styles.input} value={it} readOnly={readOnly} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} aria-label={placeholder} />
          {!readOnly && <IconButton icon="close" label="Tirar" variant="ghost" onClick={() => onChange(items.filter((_, j) => j !== i))} />}
        </div>
      ))}
      {!readOnly && (
        <form
          className={styles.listRow}
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            onChange([...items, draft.trim()]);
            setDraft("");
          }}
        >
          <input className={styles.input} value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} />
          <IconButton icon="plus" label="Adicionar" variant="secondary" type="submit" />
        </form>
      )}
    </div>
  );
}

/** Botão de rolar ao lado de um valor da ficha. */
export function RollButton({ label, onRoll }: { label: string; onRoll?: () => void }) {
  if (!onRoll) return null;
  return (
    <button type="button" className={styles.rollButton} aria-label={`Rolar ${label}`} title={`Rolar ${label}`} onClick={onRoll}>
      <Icon name="dice" size={16} />
    </button>
  );
}
