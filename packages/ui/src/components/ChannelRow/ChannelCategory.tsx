"use client";

import { useId, useState, type ReactNode } from "react";
import { cx } from "../../cx";
import { Icon } from "../Icon/Icon";
import styles from "./ChannelRow.module.sass";

export interface ChannelCategoryProps {
  /** Nome da categoria; aparece em caixa alta. */
  name: string;
  defaultOpen?: boolean;
  /** As linhas (`ChannelRow`). Cada uma vira um item de lista. */
  children: ReactNode;
}

/** Categoria recolhível acima das linhas, em `overline`. */
export function ChannelCategory({ name, defaultOpen = true, children }: ChannelCategoryProps) {
  const [open, setOpen] = useState(defaultOpen);
  const listId = useId();
  const items = Array.isArray(children) ? children : [children];

  return (
    <div className={cx(styles.category, !open && styles.collapsed)}>
      <button type="button" className={styles.categoryHeader} aria-expanded={open} aria-controls={listId} onClick={() => setOpen((o) => !o)}>
        <Icon name="chevronDown" size={12} className={styles.chevron} />
        {name}
      </button>
      <ul id={listId} className={styles.list} hidden={!open}>
        {items.map((child, i) => (
          <li key={i}>{child}</li>
        ))}
      </ul>
    </div>
  );
}
