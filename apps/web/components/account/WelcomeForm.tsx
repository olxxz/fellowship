"use client";

import { Avatar, Button, ColorPicker } from "@fellowship/ui";
import type { Profile } from "@fellowship/db";
import { useActionState, useEffect, useState } from "react";
import { avatarColor } from "@/lib/avatarColor";
import { completeWelcomeAction, type FormState } from "@/lib/app/space-actions";
import { getBrowserClient } from "@/lib/supabase/client";
import { ImageUploadField } from "./ImageUploadField";
import styles from "./Settings.module.sass";

export function WelcomeForm({ profile, next }: { profile: Profile; next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(completeWelcomeAction, {});
  const [nick, setNick] = useState(profile.username);
  const [name, setName] = useState(profile.display_name);
  const [avatar, setAvatar] = useState(profile.avatar_url ?? "");
  const [color, setColor] = useState(profile.color);
  const [free, setFree] = useState<boolean | null>(true);

  // Cor inicial combinando com a foto (a do Google tem um fundo colorido).
  useEffect(() => {
    if (profile.avatar_url) void avatarColor(profile.avatar_url).then((c) => c && setColor(c));
  }, [profile.avatar_url]);

  // Confere se o nick está livre enquanto a pessoa digita.
  useEffect(() => {
    if (!/^[a-z0-9_.]{3,20}$/.test(nick)) return;
    const t = setTimeout(async () => {
      const { data } = await getBrowserClient().rpc("username_available", { p_username: nick });
      setFree(data === true);
    }, 300);
    return () => clearTimeout(t);
  }, [nick]);

  const valid = /^[a-z0-9_.]{3,20}$/.test(nick);

  return (
    <form className={styles.form} action={action}>
      <input type="hidden" name="next" value={next} />
      <div className={styles.preview} style={{ ["--player-color" as string]: color }}>
        <Avatar name={name || "?"} src={avatar || undefined} color={color} size={56} />
        <span>
          <span className={styles.previewName}>{name || "Seu nome"}</span>
          <span className={styles.help} style={{ display: "block" }}>
            @{nick || "nick"}
          </span>
        </span>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Nick</span>
        <span className={styles.nickInput}>
          <span aria-hidden="true">@</span>
          <input
            className={styles.input}
            name="username"
            required
            autoFocus
            minLength={3}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={nick}
            onChange={(e) => {
              setNick(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""));
              setFree(null);
            }}
            aria-describedby="nick-status"
          />
        </span>
        <span className={styles.help} id="nick-status" role="status">
          {!valid ? "De 3 a 20 caracteres: letras minúsculas, números, ponto e sublinhado." : free === null ? "Conferindo…" : free ? "Disponível." : "Já está em uso. Tente outro."}
        </span>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Nome exibido</span>
        <input className={styles.input} name="display_name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <ImageUploadField
        label="Foto"
        name="avatar_url"
        value={avatar}
        onChange={(url) => {
          setAvatar(url);
          if (url) void avatarColor(url).then((c) => c && setColor(c));
        }}
        shape="square"
        bucket="perfis"
        folder={profile.id}
        help="Opcional. Sem foto, aparece a sua inicial na sua cor."
        preview={(url) => <Avatar name={name || "?"} src={url || undefined} color={color} size={72} />}
      />
      <ColorPicker label="Sua cor" name="color" value={color} onChange={setColor} help="Fundo do avatar e cor do seu perfil." />
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="primary" loading={pending} loadingLabel="Entrando…" disabled={!valid || free === false}>
        Continuar
      </Button>
    </form>
  );
}
