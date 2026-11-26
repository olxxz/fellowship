"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ReactNode } from "react";
import { cx } from "../../cx";
import styles from "./Popover.module.sass";

interface PopupProps {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  title?: string;
  children: ReactNode;
  className?: string;
}

function Popup({ side = "top", align = "center", title, children, className }: PopupProps) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner className={styles.positioner} side={side} align={align} sideOffset={8} collisionPadding={12}>
        <BasePopover.Popup className={cx(styles.popup, className)}>
          {title && <BasePopover.Title className={styles.title}>{title}</BasePopover.Title>}
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

/** Popover com o visual do Fellowship sobre o Base UI Popover. Usado na bandeja de dados. */
export const Popover = { Root: BasePopover.Root, Trigger: BasePopover.Trigger, Popup, Close: BasePopover.Close };
