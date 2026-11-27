"use client";

import { cx, Icon, playerColorStyle, type AccentColor } from "@fellowship/ui";
import { PendingIconLink } from "@/components/nav/PendingLink";
import styles from "./Rail.module.sass";
import { keepDrawerOpen, useShell } from "./ShellContext";

export interface RailSpace {
  id: string;
  name: string;
  short: string;
  color: AccentColor;
  href: string;
  iconUrl?: string | null;
  /** Há mensagens não lidas. */
  unread?: boolean;
  /** Menções a você ainda não lidas. */
  mentions?: number;
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
          <PendingIconLink href={homeHref} className={cx(styles.icon, styles.home)} aria-label="Início" aria-current={!activeSpaceId ? "page" : undefined} title="Início" onClick={keepDrawerOpen}>
            <Icon name="home" size={22} />
          </PendingIconLink>
        </li>
      </ul>
      <span className={styles.separator} aria-hidden="true" />
      <ul className={styles.list} aria-label="Cenários">
        {spaces.map((space) => {
          const active = space.id === activeSpaceId;
          return (
            <li key={space.id} className={cx(styles.item, active && styles.active, !active && space.unread && styles.unread)}>
              <PendingIconLink
                href={space.href}
                className={styles.icon}
                style={playerColorStyle(space.color, space.iconUrl ? { backgroundImage: `url("${space.iconUrl}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined)}
                aria-label={`${space.name}${space.mentions ? `, ${space.mentions} ${space.mentions === 1 ? "menção" : "menções"}` : space.unread ? ", mensagens não lidas" : ""}`}
                aria-current={active ? "page" : undefined}
                title={space.name}
                onClick={keepDrawerOpen}
              >
                {!space.iconUrl && space.short}
                {!active && !!space.mentions && (
                  <span className={styles.badge} aria-hidden="true">
                    {space.mentions > 99 ? "99+" : space.mentions}
                  </span>
                )}
              </PendingIconLink>
            </li>
          );
        })}
      </ul>
      {createHref ? (
        <PendingIconLink href={createHref} className={styles.add} aria-label="Criar Cenário" title="Criar Cenário" onClick={closeDrawer}>
          <Icon name="plus" size={22} />
        </PendingIconLink>
      ) : (
        <button type="button" className={styles.add} aria-label="Criar Cenário (só no app com login)" title="Criar Cenário (só no app com login)" disabled>
          <Icon name="plus" size={22} />
        </button>
      )}
    </div>
  );
}
