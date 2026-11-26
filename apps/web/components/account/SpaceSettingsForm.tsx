"use client";

import { Button, ColorPicker, playerColorStyle } from "@fellowship/ui";
import type { Space } from "@fellowship/db";
import { useActionState, useState } from "react";
import { updateSpaceAction, type FormState } from "@/lib/app/space-actions";
import styles from "./Settings.module.sass";

export function SpaceSettingsForm({ space }: { space: Space }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateSpaceAction.bind(null, space.id), {});
  const [name, setName] = useState(space.name);
  const [short, setShort] = useState(space.short);
  const [color, setColor] = useState(space.color);

  return (
    <form className={styles.form} action={action}>
      <div className={styles.preview} style={playerColorStyle(color)}>
        <span className={styles.previewIcon} aria-hidden="true">
          {short || "?"}
        </span>
        <span className={styles.previewName}>{name || "Nome do Cenário"}</span>
      </div>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Nome</span>
          <input className={styles.input} name="name" required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Iniciais do ícone</span>
          <input className={styles.input} name="short" required maxLength={3} value={short} onChange={(e) => setShort(e.target.value.toUpperCase())} />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Descrição</span>
        <textarea className={styles.textarea} name="description" maxLength={300} defaultValue={space.description ?? ""} />
      </label>
      <ColorPicker label="Cor do Cenário" name="color" value={color} onChange={setColor} help="Aparece no ícone da barra de Cenários, no banner e nos convites." />
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      {state.saved && !pending && (
        <p className={styles.saved} role="status">
          Alterações salvas.
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" variant="primary" loading={pending} loadingLabel="Salvando…">
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}
