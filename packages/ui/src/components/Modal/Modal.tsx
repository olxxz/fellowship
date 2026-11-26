"use client";

import { Dialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { IconButton } from "../Button/Button";
import styles from "./Modal.module.sass";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/** Diálogo centralizado (Base UI Dialog): convidar, confirmar uma ação. */
export function Modal({ open, onOpenChange, title, description, children }: ModalProps) {
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
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
