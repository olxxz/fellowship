"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useRef, type ReactNode } from "react";
import styles from "./BottomSheet.module.sass";

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nome para leitores de tela (o conteúdo pode mostrar o título como quiser). */
  label: string;
  children: ReactNode;
}

/**
 * Painel que sobe do rodapé na largura da tela (no desktop, centralizado e mais estreito), com alça.
 * Fecha com Esc, tocando fora ou arrastando a alça para baixo. Base UI Dialog.
 */
export function BottomSheet({ open, onOpenChange, label, children }: BottomSheetProps) {
  const popup = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);

  // Arrastar a alça para baixo: o painel acompanha o dedo; passou de 1/4 da altura, fecha.
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { y: e.clientY, dy: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !popup.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    popup.current.style.transition = "none";
    popup.current.style.transform = `translateY(${drag.current.dy}px)`;
  };
  const onPointerUp = () => {
    const el = popup.current;
    if (!drag.current || !el) return;
    const close = drag.current.dy > el.offsetHeight / 4;
    drag.current = null;
    el.style.transition = "";
    el.style.transform = "";
    if (close) onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup ref={popup} className={styles.popup} aria-label={label} initialFocus={popup}>
          <div className={styles.handleArea} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
            <span className={styles.handle} aria-hidden="true" />
          </div>
          <div className={styles.body}>{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Fecha o painel (envolve um botão do conteúdo). */
export const BottomSheetClose = Dialog.Close;
