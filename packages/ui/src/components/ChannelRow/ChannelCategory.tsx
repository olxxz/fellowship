"use client";

import { isValidElement, useId, useState, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cx } from "../../cx";
import { Icon } from "../Icon/Icon";
import styles from "./ChannelRow.module.sass";

export interface ChannelCategoryProps {
  /** Nome da categoria; aparece em caixa alta. */
  name: string;
  defaultOpen?: boolean;
  /** Aberta ou fechada controlada de fora (ex.: salva por pessoa). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Ação ao lado do nome (ex.: botão de criar canal). Fica fora do botão de recolher. */
  action?: ReactNode;
  /** Atributos extras na barra do nome (ex.: alça de arrastar). */
  barProps?: HTMLAttributes<HTMLDivElement>;
  rootRef?: Ref<HTMLDivElement>;
  style?: CSSProperties;
  className?: string;
  /** Fechada, ainda mostra isto (ex.: o canal em que a pessoa está, como no Discord). */
  collapsedContent?: ReactNode;
  /** As linhas (`ChannelRow`). Cada uma vira um item de lista. */
  children: ReactNode;
}

/** Categoria recolhível acima das linhas, em `overline`. */
export function ChannelCategory({ name, defaultOpen = true, open: openProp, onOpenChange, action, barProps, rootRef, style, className, collapsedContent, children }: ChannelCategoryProps) {
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const listId = useId();
  const items = (Array.isArray(children) ? children : [children]).filter((c) => c !== null && c !== undefined && c !== false);
  const toggle = () => {
    setOpenState(!open);
    onOpenChange?.(!open);
  };

  return (
    <div ref={rootRef} style={style} className={cx(styles.category, !open && styles.collapsed, className)}>
      <div {...barProps} className={cx(styles.categoryBar, barProps?.className)}>
        <button type="button" className={styles.categoryHeader} aria-expanded={open} aria-controls={listId} onClick={toggle}>
          <Icon name="chevronDown" size={12} className={styles.chevron} />
          {name}
        </button>
        {action && <span className={styles.categoryAction}>{action}</span>}
      </div>
      <ul id={listId} className={styles.list} hidden={!open}>
        {items.map((child, i) => (
          <li key={isValidElement(child) && child.key != null ? child.key : i}>{child}</li>
        ))}
      </ul>
      {!open && collapsedContent}
    </div>
  );
}
