import type { SVGProps } from "react";
import { icons, type IconName } from "./icons";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  /** Lado em px. Padrão 18 (linhas e botões). */
  size?: number;
  /** Texto para leitores de tela. Sem ele, o ícone é decorativo (aria-hidden). */
  label?: string;
}

export function Icon({ name, size = 18, label, ...rest }: IconProps) {
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
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      {...rest}
    >
      {icons[name]}
    </svg>
  );
}
