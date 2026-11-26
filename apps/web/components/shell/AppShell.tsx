"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cx } from "@fellowship/ui";
import { useFlag } from "@/lib/prefs";
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

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    // Se a janela crescer para desktop com a gaveta aberta, fecha (senão o conteúdo ficaria inerte).
    const media = window.matchMedia(DESKTOP);
    const onMedia = () => media.matches && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    media.addEventListener("change", onMedia);
    return () => {
      window.removeEventListener("keydown", onKey);
      media.removeEventListener("change", onMedia);
    };
  }, [drawerOpen]);

  const state = useMemo<ShellState>(
    () => ({
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      membersOpen,
      setMembersOpen,
    }),
    [drawerOpen, membersOpen, setMembersOpen],
  );

  return (
    <ShellContext.Provider value={state}>
      <div className={styles.shell}>
        <nav className={cx(styles.nav, drawerOpen && styles.navOpen)} aria-label="Navegação">
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
