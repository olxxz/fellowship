"use client";

import { Icon } from "@fellowship/ui";
import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";
import styles from "./PendingLink.module.sass";

function Pending({ overlay }: { overlay?: boolean }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span className={overlay ? styles.overlay : styles.inline} aria-hidden="true">
      <Icon name="spinner" motion="spin" size={overlay ? 12 : 14} />
    </span>
  );
}

/**
 * Link do Next.js que mostra um indicador girando enquanto a página nova carrega,
 * para o clique sempre ter resposta (useLinkStatus). `overlay` põe o indicador no canto (ícones).
 */
export function PendingLink({ children, overlay, ...props }: ComponentProps<typeof Link> & { overlay?: boolean }) {
  return (
    <Link {...props}>
      {children}
      <Pending overlay={overlay} />
    </Link>
  );
}

/** Variante para os ícones da barra de Cenários. */
export function PendingIconLink(props: ComponentProps<typeof Link>) {
  return <PendingLink {...props} overlay />;
}
