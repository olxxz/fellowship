"use client";

import { useEffect, useRef, type RefObject } from "react";
import { inSystemEdge, lockAxis, shouldCommit, velocity, type Axis, type Sample } from "./gesture";

type Kind = "openNav" | "closeNav" | "openMembers" | "closeMembers";

interface Drag {
  x0: number;
  y0: number;
  axis: Axis;
  kind: Kind | null;
  /** Largura da gaveta em jogo (navegação ou membros). */
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
 * (e fecha a navegação). O trilho (navegação + conteúdo + membros) acompanha o dedo, empurrando o conteúdo;
 * ao soltar, confirma por distância ou velocidade (lib/gesture.ts).
 */
export function useSwipeDrawers(
  rootRef: RefObject<HTMLElement | null>,
  trackRef: RefObject<HTMLElement | null>,
  navRef: RefObject<HTMLElement | null>,
  options: SwipeDrawersOptions,
) {
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

    const scrim = () => root.querySelector<HTMLElement>("[data-scrim]");
    const reset = () => {
      const track = trackRef.current;
      if (track) {
        track.style.transition = "";
        track.style.transform = "";
      }
      const veil = scrim();
      if (veil) {
        veil.style.transition = "";
        veil.style.opacity = "";
      }
    };

    const onStart = (e: TouchEvent) => {
      drag = null;
      if (!mobile.matches || e.touches.length !== 1) return;
      const touch = e.touches[0]!;
      const target = e.target as Element;
      if (target.closest(IGNORE) || (!standalone && inSystemEdge(touch.clientX, window.innerWidth)) || insideHorizontalScroll(target, root)) return;
      drag = { x0: touch.clientX, y0: touch.clientY, axis: "pending", kind: null, width: 0, dx: 0, samples: [{ x: touch.clientX, t: performance.now() }] };
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
        const drawer = drag.kind === "openNav" || drag.kind === "closeNav" ? navRef.current : membersEl;
        if (!drag.kind || !drawer || !trackRef.current) {
          drag = null;
          return;
        }
        drag.width = drawer.getBoundingClientRect().width;
        trackRef.current.style.transition = "none";
        const veil = scrim();
        if (veil) veil.style.transition = "none";
      }

      e.preventDefault(); // o arrasto lateral é da gaveta, não da página
      drag.dx = dx;
      drag.samples.push({ x: touch.clientX, t: performance.now() });
      if (drag.samples.length > 20) drag.samples.shift();

      // Deslocamento do trilho: positivo mostra a navegação, negativo mostra os membros.
      const w = drag.width;
      const shift =
        drag.kind === "openNav"
          ? Math.min(w, Math.max(0, dx))
          : drag.kind === "closeNav"
            ? Math.min(w, Math.max(0, w + dx))
            : drag.kind === "openMembers"
              ? Math.max(-w, Math.min(0, dx))
              : Math.max(-w, Math.min(0, -w + dx));
      trackRef.current!.style.transform = `translateX(${shift}px)`;
      const veil = scrim();
      if (veil) veil.style.opacity = String((Math.abs(shift) / w) * 0.6);
    };

    const onEnd = () => {
      const d = drag;
      drag = null;
      if (!d || d.axis !== "horizontal" || !d.kind) return;
      const direction = d.kind === "openNav" || d.kind === "closeMembers" ? 1 : -1;
      const commit = shouldCommit(d.dx, velocity(d.samples), d.width, direction);
      reset(); // a transição do CSS leva o trilho até o estado final
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
  }, [rootRef, trackRef, navRef]);
}
