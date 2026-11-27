import type { CSSProperties } from "react";
import { cx } from "../../cx";
import { playerColorStyle, type AccentColor } from "../../player-color";
import styles from "./Avatar.module.sass";

export type PresenceStatus = "online" | "ausente" | "em-sessao" | "offline";

const STATUS_LABEL: Record<PresenceStatus, string> = {
  online: "online",
  ausente: "ausente",
  "em-sessao": "em sessão",
  offline: "offline",
};

export interface AvatarProps {
  name: string;
  src?: string;
  /** Cor de fundo: cor de personagem (1–6) ou cor livre do perfil em hex. Sem ela, fundo neutro. */
  color?: AccentColor;
  /** `ring`: retrato de personagem, com anel na cor dele em vez de fundo cheio. */
  appearance?: "fill" | "ring";
  /** Lado em px. Padrão: 40 (size-avatar). */
  size?: number;
  status?: PresenceStatus;
  /** Por padrão o avatar é decorativo (o nome já está ao lado). Com `labelled`, ele anuncia o nome. */
  labelled?: boolean;
  className?: string;
}

/**
 * Fotos do Google vêm pequenas (…=s96-c, 96 px). Pede o tamanho que o avatar precisa em telas de alta densidade
 * (3x, no mínimo 128 px), para não ficar borrada no perfil grande.
 */
function sharpSrc(src: string, size: number) {
  if (!/googleusercontent\.com/.test(src)) return src;
  const px = Math.max(128, Math.ceil(size * 3));
  return /=s\d+(-c)?$/.test(src) ? src.replace(/=s\d+(-c)?$/, `=s${px}-c`) : `${src}=s${px}-c`;
}

export function Avatar({ name, src, color, appearance = "fill", size = 40, status, labelled, className }: AvatarProps) {
  const style = { ...(color ? playerColorStyle(color) : {}), ["--avatar-size" as string]: `${size}px` } as CSSProperties;
  return (
    <span
      className={cx(styles.avatar, !color && styles.neutral, appearance === "ring" && styles.ring, className)}
      style={style}
      {...(labelled ? { role: "img", "aria-label": status ? `${name}, ${STATUS_LABEL[status]}` : name } : { "aria-hidden": true })}
    >
      {src ? <img className={styles.image} src={sharpSrc(src, size)} alt="" /> : name.charAt(0).toUpperCase()}
      {status && <span className={cx(styles.status, styles[status])} />}
    </span>
  );
}
