"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "@fellowship/ui";
import { useFlag } from "@/lib/prefs";
import { useSwipeDrawers } from "@/lib/useSwipeDrawers";
import styles from "./AppShell.module.sass";
import { ShellContext, type ShellState } from "./ShellContext";

const DESKTOP = "(min-width: 768px)";

/**
 * Casca do app em quatro colunas, como no Discord: barra de Cenários, barra lateral, conteúdo e (dentro do conteúdo) membros.
 * No celular, a barra de Cenários e a lateral viram uma gaveta que desliza da esquerda.
 */
export function AppShell({ rail, sidebar, children }: { rail: ReactNode; sidebar: ReactNode; children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useFlag("membros", true);
  const [mobileMembersOpen, setMobileMembersOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useSwipeDrawers(rootRef, navRef, {
    navOpen: drawerOpen,
    setNavOpen: (open) => {
      setDrawerOpen(open);
      if (open) setMobileMembersOpen(false);
    },
    membersOpen: mobileMembersOpen,
    setMembersOpen: (open) => {
      setMobileMembersOpen(open);
      if (open) setDrawerOpen(false);
    },
  });

  useEffect(() => {
    if (!drawerOpen && !mobileMembersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setDrawerOpen(false);
      setMobileMembersOpen(false);
    };
    // Se a janela crescer para desktop com a gaveta aberta, fecha (senão o conteúdo ficaria inerte).
    const media = window.matchMedia(DESKTOP);
    const onMedia = () => {
      if (!media.matches) return;
      setDrawerOpen(false);
      setMobileMembersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    media.addEventListener("change", onMedia);
    return () => {
      window.removeEventListener("keydown", onKey);
      media.removeEventListener("change", onMedia);
    };
  }, [drawerOpen, mobileMembersOpen]);

  const state = useMemo<ShellState>(
    () => ({
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      membersOpen,
      setMembersOpen,
      mobileMembersOpen,
      setMobileMembersOpen,
    }),
    [drawerOpen, membersOpen, setMembersOpen, mobileMembersOpen],
  );

  return (
    <ShellContext.Provider value={state}>
      <div ref={rootRef} className={styles.shell} data-app-shell="">
        <nav ref={navRef} className={cx(styles.nav, drawerOpen && styles.navOpen)} aria-label="Navegação">
          {rail}
          {sidebar}
        </nav>
        {drawerOpen && <button type="button" className={styles.backdrop} aria-label="Fechar navegação" onClick={() => setDrawerOpen(false)} />}
        <div className={styles.content} inert={drawerOpen}>
          {children}
        </div>
      </div>
    </ShellContext.Provider>
  );
}
