"use client";

import { Button, Modal } from "@fellowship/ui";
import { useCallback, useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { SHAPES, type CropRect, type ImageShape } from "@/lib/upload";
import styles from "./CropDialog.module.sass";

interface View {
  zoom: number;
  x: number;
  y: number;
}

/**
 * Editor de corte: arraste para alinhar, aproxime/afaste com o controle, a roda do mouse ou a pinça.
 * A moldura tem a proporção de onde a imagem vai aparecer (redonda no avatar).
 */
export function CropDialog({ src, shape, round, title, onCancel, onConfirm }: { src: string; shape: ImageShape; round?: boolean; title: string; onCancel: () => void; onConfirm: (crop: CropRect) => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const ratio = SHAPES[shape].w / SHAPES[shape].h;

  useEffect(() => {
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  // A moldura aparece dentro do diálogo (portal) depois do primeiro render: mede quando o elemento existir.
  const observer = useRef<ResizeObserver | null>(null);
  const frameRef = useCallback((el: HTMLDivElement | null) => {
    frame.current = el;
    observer.current?.disconnect();
    if (!el) return;
    observer.current = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    observer.current.observe(el);
  }, []);

  // Escala que cobre a moldura (zoom 1) e limites para a imagem nunca deixar buraco.
  const base = natural && box.w ? Math.max(box.w / natural.w, box.h / natural.h) : 1;
  const scale = base * view.zoom;
  const clamp = (v: View): View => {
    if (!natural) return v;
    const s = base * v.zoom;
    const minX = box.w - natural.w * s;
    const minY = box.h - natural.h * s;
    return { zoom: v.zoom, x: Math.min(0, Math.max(minX, v.x)), y: Math.min(0, Math.max(minY, v.y)) };
  };
  // Centraliza ao carregar (e quando a moldura muda de tamanho).
  const [centered, setCentered] = useState("");
  const key = natural && box.w ? `${natural.w}x${natural.h}@${box.w}x${box.h}` : "";
  if (key && key !== centered) {
    setCentered(key);
    setView({ zoom: 1, x: (box.w - natural!.w * base) / 2, y: (box.h - natural!.h * base) / 2 });
  }

  // Aproximar mantendo o ponto (cx, cy) da moldura no lugar.
  const zoomTo = (zoom: number, cx = box.w / 2, cy = box.h / 2) => {
    setView((v) => {
      const z = Math.min(5, Math.max(1, zoom));
      const k = z / v.zoom;
      return clamp({ zoom: z, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k });
    });
  };

  const onPointerDown = (e: PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), zoom: view.zoom };
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const rect = frame.current!.getBoundingClientRect();
      zoomTo((pinch.current.zoom * Math.hypot(a!.x - b!.x, a!.y - b!.y)) / pinch.current.dist, (a!.x + b!.x) / 2 - rect.left, (a!.y + b!.y) / 2 - rect.top);
      return;
    }
    setView((v) => clamp({ ...v, x: v.x + e.clientX - prev.x, y: v.y + e.clientY - prev.y }));
  };
  const onPointerUp = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };
  const onWheel = (e: WheelEvent) => {
    const rect = frame.current!.getBoundingClientRect();
    zoomTo(view.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX - rect.left, e.clientY - rect.top);
  };

  function confirm() {
    if (!natural) return;
    onConfirm({ x: -view.x / scale, y: -view.y / scale, width: box.w / scale, height: box.h / scale });
  }

  return (
    <Modal open onOpenChange={(o) => !o && onCancel()} title={title}>
      <div className={styles.wrap}>
        <div
          ref={frameRef}
          className={`${styles.frame} ${round ? styles.round : ""}`}
          style={{ aspectRatio: `${ratio}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          {natural && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              className={styles.image}
              style={{ width: natural.w * scale, height: natural.h * scale, transform: `translate(${view.x}px, ${view.y}px)` }}
            />
          )}
        </div>
        <label className={styles.zoom}>
          <span aria-hidden="true">−</span>
          <input type="range" min={1} max={5} step={0.01} value={view.zoom} aria-label="Aproximar" onChange={(e) => zoomTo(Number(e.target.value))} />
          <span aria-hidden="true">+</span>
        </label>
        <p className={styles.help}>Arraste para alinhar. Aproxime com o controle, a roda do mouse ou dois dedos.</p>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="primary" icon="check" disabled={!natural} onClick={confirm}>
            Usar imagem
          </Button>
        </div>
      </div>
    </Modal>
  );
}
