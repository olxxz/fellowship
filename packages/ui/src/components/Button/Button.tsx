import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ElementType, ReactNode } from "react";
import { cx } from "../../cx";
import { Icon, type IconMotion } from "../Icon/Icon";
import type { IconName } from "../Icon/icons";
import { Skeleton } from "../Skeleton/Skeleton";
import styles from "./Button.module.sass";

/**
 * - `primary`: uma por tela, a ação que conclui a tarefa.
 * - `secondary`: ações de apoio.
 * - `mesa`: tudo o que é jogo (rolar dados, entrar na Mesa, pedir teste).
 * - `danger`: sair da sala, apagar. Nunca a ação principal de uma tela comum.
 * - `ghost`: sem fundo até passar o mouse ou ficar ativo; para ações de barra (menu, membros, tela cheia).
 */
export type ButtonVariant = "primary" | "secondary" | "mesa" | "danger" | "ghost";

interface BaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Mostra um indicador girando (e o `loadingLabel`, se houver) sem mudar a largura. O clique é ignorado enquanto carrega. */
  loading?: boolean;
}

export interface ButtonProps extends BaseProps {
  /** Ícone opcional à esquerda, 18px. */
  icon?: IconName;
  /** O que está acontecendo enquanto carrega ("Criando…"). O espaço dele já fica reservado, para o botão não pular. */
  loadingLabel?: string;
  /** Movimento do ícone (ex.: `pop` ao confirmar, `tumble` ao rolar). */
  iconMotion?: IconMotion;
  /** Mude a chave para repetir o movimento do ícone (ex.: a cada rolagem), sem remontar o botão. */
  iconKey?: string | number;
  children: ReactNode;
}

function ButtonBase({ variant = "secondary", icon, loading, loadingLabel, iconMotion, iconKey, className, children, onClick, type = "button", ...rest }: ButtonProps) {
  // Sem texto de carregamento: o indicador entra no lugar do ícone (ou sozinho, centralizado), na mesma largura.
  const busy = loadingLabel ?? (icon ? children : null);
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      className={cx(styles.button, styles[variant], loading && styles.loading, className)}
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      <span className={styles.stack}>
        <span className={styles.content}>
          {icon && <Icon key={iconKey} name={icon} motion={iconMotion} />}
          {children}
        </span>
        {(loading || loadingLabel) && (
          <span className={styles.busy} aria-hidden="true">
            <Icon name="spinner" motion={loading ? "spin" : undefined} />
            {busy}
          </span>
        )}
      </span>
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
      // Sem a classe loading: aqui o próprio ícone vira o indicador (não há rótulo para esconder).
      className={cx(styles.button, styles[variant], styles.iconOnly, className)}
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      <span className={styles.content}>{loading ? <Icon name="spinner" motion="spin" /> : <Icon name={icon} />}</span>
    </button>
  );
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  icon?: IconName;
  /** Componente de link (ex.: `Link` do Next.js). Padrão: `<a>`. */
  linkAs?: ElementType;
  children: ReactNode;
}

/** Link com cara de botão, para ações que navegam ("Criar Cenário"). Nunca um botão dentro de um link. */
export function ButtonLink({ variant = "secondary", icon, linkAs: LinkAs = "a", className, children, ...rest }: ButtonLinkProps) {
  return (
    <LinkAs className={cx(styles.button, styles[variant], className)} {...rest}>
      <span className={styles.content}>
        {icon && <Icon name={icon} />}
        {children}
      </span>
    </LinkAs>
  );
}
