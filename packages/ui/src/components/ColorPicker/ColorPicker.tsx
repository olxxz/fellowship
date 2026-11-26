"use client";

import { useId, useState } from "react";
import { isHexColor, playerColorStyle, PRESET_COLORS } from "../../player-color";
import styles from "./ColorPicker.module.sass";

export interface ColorPickerProps {
  label: string;
  /** Cor atual em hex (#rrggbb). */
  value: string;
  onChange: (hex: string) => void;
  /** Nome do campo no formulário (envia o hex num input escondido). */
  name?: string;
  help?: string;
}

/** Seletor de cor livre: cores sugeridas, seletor nativo e campo em hex, com amostra do texto por cima. */
export function ColorPicker({ label, value, onChange, name, help }: ColorPickerProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const hex = value.toLowerCase();
  const draftValid = isHexColor(draft);

  const choose = (next: string) => {
    setDraft(next);
    onChange(next.toLowerCase());
  };

  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{label}</legend>
      {name && <input type="hidden" name={name} value={hex} />}
      <div className={styles.swatches}>
        {PRESET_COLORS.map((c) => (
          <label key={c.hex} className={styles.swatch} style={{ ["--swatch" as string]: c.hex }} title={c.name}>
            <input type="radio" name={`${id}-preset`} checked={hex === c.hex} onChange={() => choose(c.hex)} aria-label={c.name} />
            <span aria-hidden="true" />
          </label>
        ))}
      </div>
      <div className={styles.custom}>
        <input type="color" className={styles.native} value={hex} onChange={(e) => choose(e.target.value)} aria-label="Escolher qualquer cor" />
        <input
          className={styles.hex}
          value={draft}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          aria-label="Cor em hexadecimal"
          aria-invalid={!draftValid}
          onChange={(e) => {
            const v = e.target.value.trim().startsWith("#") ? e.target.value.trim() : `#${e.target.value.trim()}`;
            setDraft(v);
            if (isHexColor(v)) onChange(v.toLowerCase());
          }}
        />
        <span className={styles.sample} style={playerColorStyle(hex)} aria-hidden="true">
          Aa
        </span>
      </div>
      <p className={styles.help}>{help ?? "Escolha uma sugestão ou qualquer cor. O texto por cima fica claro ou escuro sozinho, para dar leitura."}</p>
    </fieldset>
  );
}
