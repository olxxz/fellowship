import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cx } from "../../cx";
import styles from "./Skeleton.module.sass";

export interface SkeletonProps {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  /** Círculo, para avatares. */
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Bloco de carregamento em `bg-input`. Decorativo: quem anuncia o carregamento é o `SkeletonRegion`. */
export function Skeleton({ width = "100%", height = 12, circle, className, style }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      data-skeleton=""
      className={cx(styles.block, circle && styles.circle, className)}
      style={{ width, height, ...style }}
    />
  );
}

/** Larguras entre 20% e 85%, em ordem fixa, para as linhas parecerem texto sem mudar a cada render. */
const LINE_WIDTHS = ["72%", "45%", "85%", "30%", "60%", "20%", "78%", "52%"];

export interface SkeletonTextProps {
  lines?: number;
  /** Altura de cada linha em px. */
  lineHeight?: number;
  /** Desloca a sequência de larguras, para linhas vizinhas não ficarem iguais. */
  seed?: number;
  className?: string;
}

export function SkeletonText({ lines = 2, lineHeight = 12, seed = 0, className }: SkeletonTextProps) {
  return (
    <span aria-hidden="true" className={cx(styles.text, className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={lineHeight} width={LINE_WIDTHS[(i + seed) % LINE_WIDTHS.length]} />
      ))}
    </span>
  );
}

export interface SkeletonRegionProps extends HTMLAttributes<HTMLDivElement> {
  loading: boolean;
  /** Anunciado uma vez para leitores de tela. */
  label?: string;
  /** O que mostrar enquanto carrega (normalmente `Componente.Skeleton`). */
  fallback: ReactNode;
  children: ReactNode;
}

/** Região que carrega sozinha: marca `aria-busy` e anuncia "Carregando…" enquanto mostra o esqueleto. */
export function SkeletonRegion({ loading, label = "Carregando…", fallback, children, ...rest }: SkeletonRegionProps) {
  return (
    <div aria-busy={loading} {...rest}>
      {loading ? (
        <>
          <span role="status" className={styles.hidden}>
            {label}
          </span>
          {fallback}
        </>
      ) : (
        children
      )}
    </div>
  );
}
