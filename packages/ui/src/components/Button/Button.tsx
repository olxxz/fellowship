import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../../cx";
import { Icon } from "../Icon/Icon";
import type { IconName } from "../Icon/icons";
import { Skeleton } from "../Skeleton/Skeleton";
import styles from "./Button.module.sass";

/**
 * - `primary`: uma por tela, a ação que conclui a tarefa.
 * - `secondary`: ações de apoio.
 * - `mesa`: tudo o que é jogo (rolar dados, entrar na Mesa, pedir teste).
 * - `danger`: sair da sala, apagar. Nunca a ação principal de uma tela comum.
 */
export type ButtonVariant = "primary" | "secondary" | "mesa" | "danger";

interface BaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Mantém a largura e troca o rótulo por um esqueleto. O clique é ignorado enquanto carrega. */
  loading?: boolean;
}

export interface ButtonProps extends BaseProps {
  /** Ícone opcional à esquerda, 18px. */
  icon?: IconName;
  children: ReactNode;
}

function ButtonBase({ variant = "secondary", icon, loading, className, children, onClick, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      className={cx(styles.button, styles[variant], loading && styles.loading, className)}
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      <span className={styles.content}>
        {icon && <Icon name={icon} />}
        {children}
      </span>
      {loading && <span aria-hidden="true" className={styles.loadingBar} />}
    </button>
  );
}

function ButtonSkeleton({ width = 120 }: { width?: number | string }) {
  return <Skeleton width={width} height={44} className={styles.skeleton} />;
}

export const Button = Object.assign(ButtonBase, { Skeleton: ButtonSkeleton });

export interface IconButtonProps extends BaseProps {
  icon: IconName;
  /** Obrigatório: é o nome do botão para leitores de tela. */
  label: string;
}

/** Botão só de ícone: redondo, 44px, com `aria-label`. */
export function IconButton({ variant = "secondary", icon, label, loading, className, onClick, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      aria-busy={loading || undefined}
      className={cx(styles.button, styles[variant], styles.iconOnly, loading && styles.loading, className)}
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      <span className={styles.content}>
        <Icon name={icon} />
      </span>
      {loading && <span aria-hidden="true" className={styles.loadingBar} />}
    </button>
  );
}
