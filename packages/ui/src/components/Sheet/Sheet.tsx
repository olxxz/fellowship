"use client";

import { Dialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { IconButton } from "../Button/Button";
import styles from "./Sheet.module.sass";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/** Painel que entra pela direita (desktop) ou sobe do rodapé (celular). Usado para a ficha. Base UI Dialog. */
export function Sheet({ open, onOpenChange, title, description, children }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <div className={styles.header}>
            <div className={styles.titles}>
              <Dialog.Title className={styles.title}>{title}</Dialog.Title>
              {description && <Dialog.Description className={styles.description}>{description}</Dialog.Description>}
            </div>
            <Dialog.Close render={<IconButton icon="close" label="Fechar" />} />
          </div>
          <div className={styles.body}>{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
