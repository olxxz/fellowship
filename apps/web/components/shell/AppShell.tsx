"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "@fellowship/ui";
import { useFlag } from "@/lib/prefs";
import { useIsMobile } from "@/lib/useIsMobile";
import { useSwipeDrawers } from "@/lib/useSwipeDrawers";
import styles from "./AppShell.module.sass";
import { ShellContext, type ShellState } from "./ShellContext";

const DESKTOP = "(min-width: 768px)";

/**
 * Casca do app em quatro colunas, como no Discord: barra de Cenários, barra lateral, conteúdo e (dentro do conteúdo) membros.
 * No celular, a navegação fica à esquerda e os membros à direita: abrir empurra o conteúdo para o lado (não cobre).
 */
export function AppShell({ rail, sidebar, panel, children }: { rail: ReactNode; sidebar: ReactNode; panel?: ReactNode; children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useFlag("membros", true);
  const [mobileMembersOpen, setMobileMembersOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();

  useSwipeDrawers(rootRef, trackRef, navRef, {
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

  const hasPanel = !!panel;
  // Altura do painel flutuante (muda quando a faixa da voz aparece): as barras reservam esse espaço embaixo.
  useEffect(() => {
    const el = panelRef.current;
    const nav = navRef.current;
    if (!el || !nav) return;
    const ro = new ResizeObserver(() => nav.style.setProperty("--dock-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasPanel]);

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
        <div ref={trackRef} className={cx(styles.track, drawerOpen && styles.trackNav, mobileMembersOpen && styles.trackMembers)}>
          <nav ref={navRef} className={cx(styles.nav, panel ? styles.navWithPanel : undefined)} aria-label="Navegação" inert={mobile && !drawerOpen ? true : undefined}>
            {rail}
            {sidebar}
            {/* Conta e voz: embaixo das duas barras, separado delas; aparece em qualquer página. */}
            {panel && (
              <div ref={panelRef} className={styles.panel}>
                {panel}
              </div>
            )}
          </nav>
          <div className={styles.content} inert={drawerOpen}>
            {children}
          </div>
          <button
            type="button"
            className={cx(styles.scrim, (drawerOpen || mobileMembersOpen) && styles.scrimVisible)}
            aria-label={drawerOpen ? "Fechar navegação" : "Fechar membros"}
            tabIndex={drawerOpen || mobileMembersOpen ? 0 : -1}
            aria-hidden={drawerOpen || mobileMembersOpen ? undefined : true}
            data-scrim=""
            onClick={() => {
              setDrawerOpen(false);
              setMobileMembersOpen(false);
            }}
          />
        </div>
      </div>
    </ShellContext.Provider>
  );
}
