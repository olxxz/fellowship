"use client";

import { useEffect, useRef, type RefObject } from "react";
import { inSystemEdge, lockAxis, shouldCommit, velocity, type Axis, type Sample } from "./gesture";

type Kind = "openNav" | "closeNav" | "openMembers" | "closeMembers";

interface Drag {
  x0: number;
  y0: number;
  axis: Axis;
  kind: Kind | null;
  el: HTMLElement | null;
  width: number;
  dx: number;
  samples: Sample[];
}

const IGNORE = 'input, textarea, select, [contenteditable="true"], [data-no-swipe], [role="dialog"], [role="menu"]';

/** O toque começou dentro de algo que rola para o lado (aí o gesto é dessa área, não das gavetas)? */
function insideHorizontalScroll(target: Element, root: Element) {
  for (let el: Element | null = target; el && el !== root; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (el.scrollWidth > el.clientWidth + 1 && (style.overflowX === "auto" || style.overflowX === "scroll")) return true;
  }
  return false;
}

export interface SwipeDrawersOptions {
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  membersOpen: boolean;
  setMembersOpen: (open: boolean) => void;
}

/**
 * Celular: arrastar para a direita abre a navegação (e fecha os membros); para a esquerda abre os membros
 * (e fecha a navegação). A gaveta acompanha o dedo; ao soltar, confirma por distância ou velocidade (lib/gesture.ts).
 */
export function useSwipeDrawers(rootRef: RefObject<HTMLElement | null>, navRef: RefObject<HTMLElement | null>, options: SwipeDrawersOptions) {
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mobile = window.matchMedia("(max-width: 767px)");
    // Instalado como app não há gesto de voltar do navegador na borda.
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    let drag: Drag | null = null;

    const reset = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.transition = "";
      el.style.transform = "";
      el.style.visibility = "";
    };

    const onStart = (e: TouchEvent) => {
      drag = null;
      if (!mobile.matches || e.touches.length !== 1) return;
      const touch = e.touches[0]!;
      const target = e.target as Element;
      if (target.closest(IGNORE) || (!standalone && inSystemEdge(touch.clientX, window.innerWidth)) || insideHorizontalScroll(target, root)) return;
      drag = { x0: touch.clientX, y0: touch.clientY, axis: "pending", kind: null, el: null, width: 0, dx: 0, samples: [{ x: touch.clientX, t: performance.now() }] };
    };

    const onMove = (e: TouchEvent) => {
      if (!drag) return;
      const touch = e.touches[0]!;
      const dx = touch.clientX - drag.x0;
      const dy = touch.clientY - drag.y0;

      if (drag.axis === "pending") {
        drag.axis = lockAxis(dx, dy);
        if (drag.axis === "pending") return;
        if (drag.axis === "vertical") {
          drag = null; // rolagem: o gesto não é nosso até soltar
          return;
        }
        const { navOpen, membersOpen } = latest.current;
        const membersEl = root.querySelector<HTMLElement>('[data-drawer="members"]');
        drag.kind = navOpen ? (dx < 0 ? "closeNav" : null) : membersOpen ? (dx > 0 ? "closeMembers" : null) : dx > 0 ? "openNav" : membersEl ? "openMembers" : null;
        drag.el = drag.kind === "openNav" || drag.kind === "closeNav" ? navRef.current : membersEl;
        if (!drag.kind || !drag.el) {
          drag = null;
          return;
        }
        drag.width = drag.el.getBoundingClientRect().width;
        drag.el.style.transition = "none";
        drag.el.style.visibility = "visible";
      }

      e.preventDefault(); // o arrasto lateral é da gaveta, não da página
      drag.dx = dx;
      drag.samples.push({ x: touch.clientX, t: performance.now() });
      if (drag.samples.length > 20) drag.samples.shift();

      const w = drag.width;
      const x =
        drag.kind === "openNav"
          ? Math.min(0, -w + Math.max(0, dx))
          : drag.kind === "closeNav"
            ? Math.max(-w, Math.min(0, dx))
            : drag.kind === "openMembers"
              ? Math.max(0, w + Math.min(0, dx))
              : Math.min(w, Math.max(0, dx));
      drag.el!.style.transform = `translateX(${x}px)`;
    };

    const onEnd = () => {
      const d = drag;
      drag = null;
      if (!d || d.axis !== "horizontal" || !d.el || !d.kind) return;
      const direction = d.kind === "openNav" || d.kind === "closeMembers" ? 1 : -1;
      const commit = shouldCommit(d.dx, velocity(d.samples), d.width, direction);
      reset(d.el); // a transição do CSS leva a gaveta até o estado final
      if (!commit) return;
      const { setNavOpen, setMembersOpen } = latest.current;
      if (d.kind === "openNav") setNavOpen(true);
      if (d.kind === "closeNav") setNavOpen(false);
      if (d.kind === "openMembers") setMembersOpen(true);
      if (d.kind === "closeMembers") setMembersOpen(false);
    };

    root.addEventListener("touchstart", onStart, { passive: true });
    root.addEventListener("touchmove", onMove, { passive: false });
    root.addEventListener("touchend", onEnd);
    root.addEventListener("touchcancel", onEnd);
    return () => {
      root.removeEventListener("touchstart", onStart);
      root.removeEventListener("touchmove", onMove);
      root.removeEventListener("touchend", onEnd);
      root.removeEventListener("touchcancel", onEnd);
    };
  }, [rootRef, navRef]);
}
