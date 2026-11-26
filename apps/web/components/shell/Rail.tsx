"use client";

import { cx, Icon, playerColorStyle } from "@fellowship/ui";
import Link from "next/link";
import { spaces } from "@/lib/demo/data";
import { spaceHref } from "@/lib/routes";
import styles from "./Rail.module.sass";
import { useShell } from "./ShellContext";

/** Barra de Cenários: Início, um ícone por Cenário e o botão de criar. */
export function Rail({ activeSpaceId }: { activeSpaceId?: string }) {
  const { closeDrawer } = useShell();
  return (
    <div className={styles.rail}>
      <ul className={styles.list}>
        <li className={cx(styles.item, !activeSpaceId && styles.active)}>
          <Link href="/inicio" className={cx(styles.icon, styles.home)} aria-label="Início" aria-current={!activeSpaceId ? "page" : undefined} title="Início" onClick={closeDrawer}>
            <Icon name="home" size={22} />
          </Link>
        </li>
      </ul>
      <span className={styles.separator} aria-hidden="true" />
      <ul className={styles.list} aria-label="Cenários">
        {spaces.map((space) => {
          const active = space.id === activeSpaceId;
          return (
            <li key={space.id} className={cx(styles.item, active && styles.active)}>
              <Link
                href={spaceHref(space.id, "geral")}
                className={styles.icon}
                style={playerColorStyle(space.color)}
                aria-label={space.name}
                aria-current={active ? "page" : undefined}
                title={space.name}
                onClick={closeDrawer}
              >
                {space.short}
              </Link>
            </li>
          );
        })}
      </ul>
      <button type="button" className={styles.add} aria-label="Criar Cenário (em breve)" title="Criar Cenário (em breve)" disabled>
        <Icon name="plus" size={22} />
      </button>
    </div>
  );
}
