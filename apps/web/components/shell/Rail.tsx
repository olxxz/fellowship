"use client";

import { cx, Icon, playerColorStyle, type PlayerColor } from "@fellowship/ui";
import Link from "next/link";
import styles from "./Rail.module.sass";
import { useShell } from "./ShellContext";

export interface RailSpace {
  id: string;
  name: string;
  short: string;
  color: PlayerColor;
  href: string;
}

export interface RailProps {
  homeHref: string;
  spaces: RailSpace[];
  /** Cenário aberto agora. Sem ele, o Início fica ativo. */
  activeSpaceId?: string;
  /** Página de criar Cenário. Sem ela, o botão fica desabilitado. */
  createHref?: string;
}

/** Barra de Cenários: Início, um ícone por Cenário e o botão de criar. */
export function Rail({ homeHref, spaces, activeSpaceId, createHref }: RailProps) {
  const { closeDrawer } = useShell();
  return (
    <div className={styles.rail}>
      <ul className={styles.list}>
        <li className={cx(styles.item, !activeSpaceId && styles.active)}>
          <Link href={homeHref} className={cx(styles.icon, styles.home)} aria-label="Início" aria-current={!activeSpaceId ? "page" : undefined} title="Início" onClick={closeDrawer}>
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
                href={space.href}
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
      {createHref ? (
        <Link href={createHref} className={styles.add} aria-label="Criar Cenário" title="Criar Cenário" onClick={closeDrawer}>
          <Icon name="plus" size={22} />
        </Link>
      ) : (
        <button type="button" className={styles.add} aria-label="Criar Cenário (só no app com login)" title="Criar Cenário (só no app com login)" disabled>
          <Icon name="plus" size={22} />
        </button>
      )}
    </div>
  );
}
