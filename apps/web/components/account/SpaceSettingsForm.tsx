"use client";

import { Button, ColorPicker, playerColorStyle , toast } from "@fellowship/ui";
import type { Space } from "@fellowship/db";
import { useActionState, useEffect, useState } from "react";
import { updateSpaceAction, type FormState } from "@/lib/app/space-actions";
import { ImageUploadField } from "./ImageUploadField";
import styles from "./Settings.module.sass";

export function SpaceSettingsForm({ space }: { space: Space }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateSpaceAction.bind(null, space.id), {});

  // Resultado do formulário em aviso (popup).
  useEffect(() => {
    if (state.error) toast.error(state.error);
    else if (state.saved) toast.success("Alterações salvas");
  }, [state]);
  const [name, setName] = useState(space.name);
  const [short, setShort] = useState(space.short);
  const [color, setColor] = useState(space.color);
  const [icon, setIcon] = useState(space.icon_url ?? "");
  const [banner, setBanner] = useState(space.banner_url ?? "");

  return (
    <form className={styles.form} action={action}>
      <div className={styles.preview} style={playerColorStyle(color)}>
        <span className={styles.previewIcon} aria-hidden="true" style={icon ? { backgroundImage: `url("${icon}")`, backgroundSize: "cover", color: "transparent" } : undefined}>
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
      <div className={styles.row}>
        <ImageUploadField
          label="Ícone"
          name="icon_url"
          value={icon}
          onChange={setIcon}
          shape="square"
          bucket="cenarios"
          folder={space.id}
          help="Na barra de Cenários e nos convites. Sem imagem, usa as iniciais."
          preview={(url) => (
            <span className={styles.iconPreview} style={{ ...playerColorStyle(color), ...(url ? { backgroundImage: `url("${url}")`, color: "transparent" } : {}) }}>
              {short || "?"}
            </span>
          )}
        />
      </div>
      <ImageUploadField
        label="Banner"
        name="banner_url"
        value={banner}
        onChange={setBanner}
        shape="spaceBanner"
        bucket="cenarios"
        folder={space.id}
        help="Topo da barra do Cenário e cartão em Explorar. Você escolhe a área ao enviar; GIF também vale."
        preview={(url) => <div className={styles.bannerPreview} style={{ aspectRatio: "2 / 1", ...playerColorStyle(color), ...(url ? { backgroundImage: `url("${url}")` } : {}) }} />}
      />
      <label className={styles.field}>
        <span className={styles.label}>Descrição</span>
        <textarea className={styles.textarea} name="description" maxLength={300} defaultValue={space.description ?? ""} />
      </label>
      <label className={styles.switchRow}>
        <input type="checkbox" name="is_public" defaultChecked={space.is_public} />
        <span className={styles.field}>
          <span className={styles.label}>Cenário público</span>
          <span className={styles.help}>Aparece em Explorar para todo mundo e qualquer conta entra sem convite. Desligado, só entra quem recebe um convite.</span>
        </span>
      </label>
      <ColorPicker label="Cor do Cenário" name="color" value={color} onChange={setColor} help="Aparece no ícone da barra de Cenários, no banner e nos convites." />
      <div className={styles.actions}>
        <Button type="submit" variant="primary" loading={pending} loadingLabel="Salvando…">
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}
