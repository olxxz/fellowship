import { cx } from "../../cx";
import { playerColorStyle, type PlayerColor } from "../../player-color";
import { IconButton } from "../Button/Button";
import styles from "./ResourceBar.module.sass";

export interface ResourceBarProps {
  label: string;
  value: number;
  max: number;
  /** `hp` usa vital-hp, `mana` usa vital-mana; um número usa a cor do personagem. */
  tone?: "hp" | "mana" | PlayerColor;
  /** Com onChange, aparecem os botões de − e +. */
  onChange?: (value: number) => void;
}

export function ResourceBar({ label, value, max, tone = "hp", onChange }: ResourceBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const toneClass = typeof tone === "number" ? styles.player : styles[tone];
  return (
    <div className={cx(styles.bar, toneClass)} style={typeof tone === "number" ? playerColorStyle(tone) : undefined}>
      {onChange && <IconButton icon="minus" label={`Diminuir ${label}`} onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0} />}
      <div className={styles.main}>
        <div className={styles.labelRow}>
          <span className={styles.label}>{label}</span>
          <span className={styles.value} aria-hidden="true">
            {value}
            <span className={styles.max}>/{max}</span>
          </span>
        </div>
        <div className={styles.track} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${value} de ${max}`}>
          <div className={styles.fill} style={{ width: `${pct}%` }} />
        </div>
      </div>
      {onChange && <IconButton icon="plus" label={`Aumentar ${label}`} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} />}
    </div>
  );
}
