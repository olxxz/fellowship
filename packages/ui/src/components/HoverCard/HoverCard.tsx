"use client";

import { PreviewCard } from "@base-ui/react/preview-card";
import type { ReactNode } from "react";
import styles from "./HoverCard.module.sass";

export interface HoverCardProps {
  /** O que fica na página (vira um link: clicar abre `href`; parar o mouse em cima abre o cartão). */
  trigger: ReactNode;
  href: string;
  label?: string;
  triggerClassName?: string;
  side?: "top" | "bottom" | "left" | "right";
  children: ReactNode;
}

/** Cartão que aparece ao parar o mouse sobre um link (Base UI Preview Card), como o perfil na lista de membros. */
export function HoverCard({ trigger, href, label, triggerClassName, side = "left", children }: HoverCardProps) {
  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger href={href} aria-label={label} className={triggerClassName} delay={350} closeDelay={150}>
        {trigger}
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner side={side} align="start" sideOffset={12} collisionPadding={12} className={styles.positioner}>
          <PreviewCard.Popup className={styles.popup}>{children}</PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}
