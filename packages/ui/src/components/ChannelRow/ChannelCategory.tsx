"use client";

import { useId, useState, type ReactNode } from "react";
import { cx } from "../../cx";
import { Icon } from "../Icon/Icon";
import styles from "./ChannelRow.module.sass";

export interface ChannelCategoryProps {
  /** Nome da categoria; aparece em caixa alta. */
  name: string;
  defaultOpen?: boolean;
  /** Ação ao lado do nome (ex.: botão de criar canal). Fica fora do botão de recolher. */
  action?: ReactNode;
  /** As linhas (`ChannelRow`). Cada uma vira um item de lista. */
  children: ReactNode;
}

/** Categoria recolhível acima das linhas, em `overline`. */
export function ChannelCategory({ name, defaultOpen = true, action, children }: ChannelCategoryProps) {
  const [open, setOpen] = useState(defaultOpen);
  const listId = useId();
  const items = (Array.isArray(children) ? children : [children]).filter((c) => c !== null && c !== undefined && c !== false);

  return (
    <div className={cx(styles.category, !open && styles.collapsed)}>
      <div className={styles.categoryBar}>
        <button type="button" className={styles.categoryHeader} aria-expanded={open} aria-controls={listId} onClick={() => setOpen((o) => !o)}>
          <Icon name="chevronDown" size={12} className={styles.chevron} />
          {name}
        </button>
        {action && <span className={styles.categoryAction}>{action}</span>}
      </div>
      <ul id={listId} className={styles.list} hidden={!open}>
        {items.map((child, i) => (
          <li key={i}>{child}</li>
        ))}
      </ul>
    </div>
  );
}
