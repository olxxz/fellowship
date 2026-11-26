"use client";

import { Avatar, Button, ColorPicker } from "@fellowship/ui";
import type { Profile } from "@fellowship/db";
import { useActionState, useState } from "react";
import { updateProfileAction, type FormState } from "@/lib/app/space-actions";
import styles from "./Settings.module.sass";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, {});
  const [name, setName] = useState(profile.display_name);
  const [color, setColor] = useState(profile.color);

  return (
    <form className={styles.form} action={action}>
      <div className={styles.preview} style={{ ["--player-color" as string]: color }}>
        <Avatar name={name || "?"} src={profile.avatar_url ?? undefined} color={color} size={56} />
        <span className={styles.previewName}>{name || "Seu nome"}</span>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Nome exibido</span>
        <input className={styles.input} name="display_name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Bio</span>
        <textarea className={styles.textarea} name="bio" maxLength={300} defaultValue={profile.bio ?? ""} placeholder="Mestre de quinta, jogador de domingo." />
      </label>
      <ColorPicker label="Sua cor" name="color" value={color} onChange={setColor} help="Aparece no seu avatar e no seu perfil. Nos personagens, cada campanha tem a cor dela." />
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      {state.saved && !pending && (
        <p className={styles.saved} role="status">
          Perfil salvo.
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
