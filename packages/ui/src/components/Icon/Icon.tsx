import type { SVGProps } from "react";
import { cx } from "../../cx";
import styles from "./Icon.module.sass";
import { icons, type IconName } from "./icons";

/** Movimento do ícone: `spin` (carregando), `tumble` (dado rolando, uma vez), `pop` (confirmação), `pulse`, `wave` (só no ícone wave). */
export type IconMotion = "spin" | "tumble" | "pop" | "pulse" | "wave";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  /** Lado em px. Padrão 18 (linhas e botões). */
  size?: number;
  /** Texto para leitores de tela. Sem ele, o ícone é decorativo (aria-hidden). */
  label?: string;
  motion?: IconMotion;
}

export function Icon({ name, size = 18, label, motion, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      className={cx(styles.icon, motion && styles[motion], className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      {...rest}
    >
      {icons[name]}
    </svg>
  );
}
