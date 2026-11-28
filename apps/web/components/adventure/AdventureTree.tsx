"use client";

import type { Adventure } from "@fellowship/core";
import { cx, Icon } from "@fellowship/ui";
import { useMemo, useSyncExternalStore } from "react";
import { adventuresVersion, loadMap, loadSave, subscribeAdventures } from "@/lib/adventures/progress";
import styles from "./AdventureTree.module.sass";

const W = 168;
const H = 60;
const GX = 28;
const GY = 72;

const targets = (a: Adventure, id: string) =>
  (a.cenas[id]?.escolhas ?? []).flatMap((c) => [c.ir, c.teste?.sucesso, c.teste?.falha]).filter((t): t is string => !!t);

/**
 * Árvore de escolhas, como em Detroit: as cenas por onde você já passou (em qualquer partida) aparecem abertas,
 * os caminhos percorridos acesos; os que saem delas e você ainda não tomou ficam trancados, sem revelar o resto.
 */
export function AdventureTree({ adventure: a }: { adventure: Adventure }) {
  const v = useSyncExternalStore(subscribeAdventures, adventuresVersion, () => -1);
  const mounted = v >= 0;
  const map = useMemo(() => (mounted ? loadMap(a.id) : { cenas: [], arestas: [] }), [a.id, mounted, v]); // eslint-disable-line react-hooks/exhaustive-deps
  const current = useMemo(() => (mounted ? loadSave(a.id)?.state.cena : undefined), [a.id, mounted, v]); // eslint-disable-line react-hooks/exhaustive-deps

  const layout = useMemo(() => {
    // Linhas pela ordem da história: profundidade = caminho mais longo desde o início, ignorando as voltas
    // (escolhas que levam de novo a uma cena anterior, como "tentar de novo").
    const back = new Set<string>();
    const state = new Map<string, 1 | 2>(); // 1 = visitando, 2 = pronto
    const topo: string[] = [];
    const dfs = (id: string) => {
      state.set(id, 1);
      for (const t of targets(a, id)) {
        if (state.get(t) === 1) back.add(`${id}>${t}`);
        else if (!state.has(t)) dfs(t);
      }
      state.set(id, 2);
      topo.unshift(id);
    };
    dfs(a.inicio);
    if (!state.has(a.derrota)) topo.push(a.derrota);
    const depth = new Map<string, number>(topo.map((id) => [id, 0]));
    for (const id of topo) for (const t of targets(a, id)) if (!back.has(`${id}>${t}`) && depth.has(t)) depth.set(t, Math.max(depth.get(t)!, depth.get(id)! + 1));
    // A derrota (vida zerada) pode vir de qualquer lugar: fica na última linha.
    depth.set(a.derrota, Math.max(...depth.values()));
    const order = [...topo];
    const seen = new Set(map.cenas);
    // Só aparece o que você viu e as portas logo ao lado (trancadas).
    const visible = new Set<string>(seen.size ? [] : [a.inicio]);
    for (const id of seen) {
      visible.add(id);
      for (const t of targets(a, id)) visible.add(t);
    }
    const rows: string[][] = [];
    for (const id of order) if (visible.has(id)) (rows[depth.get(id)!] ??= []).push(id);
    const compact = rows.filter(Boolean);
    const widest = Math.max(1, ...compact.map((r) => r.length));
    const width = widest * W + (widest - 1) * GX;
    const pos = new Map<string, { x: number; y: number }>();
    // Quem leva a cada cena (para ordenar cada linha pela média dos pais e cruzar menos linhas).
    const parents = new Map<string, string[]>();
    for (const id of visible) for (const t of targets(a, id)) parents.set(t, [...(parents.get(t) ?? []), id]);
    compact.forEach((row, ri) => {
      const rowWidth = row.length * W + (row.length - 1) * GX;
      const center = (id: string) => {
        const xs = (parents.get(id) ?? []).map((p) => pos.get(p)?.x).filter((x): x is number => x !== undefined);
        return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : Infinity;
      };
      const ordered = ri === 0 ? row : [...row].sort((x, y) => center(x) - center(y));
      ordered.forEach((id, i) => pos.set(id, { x: (width - rowWidth) / 2 + i * (W + GX), y: ri * (H + GY) }));
    });
    const edges: Array<{ from: string; to: string; walked: boolean }> = [];
    const dup = new Set<string>();
    for (const id of visible) {
      if (!seen.has(id)) continue;
      for (const t of targets(a, id)) {
        const key = `${id}>${t}`;
        if (dup.has(key) || !pos.has(t) || t === id) continue;
        dup.add(key);
        edges.push({ from: id, to: t, walked: map.arestas.includes(key) });
      }
    }
    return { pos, edges, width, height: compact.length * H + (compact.length - 1) * GY, seen };
  }, [a, map]);

  const total = Object.keys(a.cenas).length;
  const endings = Object.entries(a.cenas).filter(([, s]) => s.fim);
  const foundEndings = endings.filter(([id]) => layout.seen.has(id));

  return (
    <div className={styles.wrap}>
      <div className={styles.summary}>
        <span>
          <strong>{Math.round((layout.seen.size / total) * 100)}%</strong> da história descoberta
        </span>
        <span>
          Finais: {foundEndings.length} de {endings.length}
        </span>
      </div>
      <div className={styles.canvas} style={{ width: layout.width, height: layout.height }}>
        <svg className={styles.lines} width={layout.width} height={layout.height} aria-hidden="true">
          {layout.edges.map((e) => {
            const p = layout.pos.get(e.from)!;
            const q = layout.pos.get(e.to)!;
            let d: string;
            if (q.y > p.y) {
              // Para baixo: do pé de uma ao topo da outra.
              const [x1, y1, x2, y2] = [p.x + W / 2, p.y + H, q.x + W / 2, q.y];
              // Pula linhas na mesma coluna: arqueia para o lado, para não passar por trás das cenas do meio.
              const bow = y2 - y1 > GY + 1 && Math.abs(x1 - x2) < W ? W / 2 + 24 : 0;
              d = bow
                ? `M${x1},${y1} C${x1 + bow},${y1 + GY / 2} ${x2 + bow},${y2 - GY / 2} ${x2},${y2}`
                : `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`;
            } else if (q.y === p.y) {
              // Mesma linha: de lado a lado, num arco por baixo.
              const right = q.x > p.x;
              const [x1, x2, y] = [right ? p.x + W : p.x, right ? q.x : q.x + W, p.y + H / 2];
              d = `M${x1},${y} C${x1 + (right ? 10 : -10)},${y + 34} ${x2 + (right ? -10 : 10)},${y + 34} ${x2},${y}`;
            } else {
              // Volta para cima (tentar de novo): pela lateral direita.
              const [x1, y1, x2, y2] = [p.x + W, p.y + H / 2, q.x + W, q.y + H / 2];
              const out = Math.max(x1, x2) + 40;
              d = `M${x1},${y1} C${out},${y1} ${out},${y2} ${x2},${y2}`;
            }
            return <path key={`${e.from}>${e.to}`} d={d} className={cx(styles.edge, e.walked && styles.edgeWalked)} />;
          })}
        </svg>
        {[...layout.pos].map(([id, p]) => {
          const scene = a.cenas[id]!;
          const known = layout.seen.has(id);
          return (
            <div
              key={id}
              className={cx(styles.node, !known && styles.locked, id === current && styles.current, known && scene.fim && styles[scene.fim])}
              style={{ left: p.x, top: p.y, width: W, height: H }}
              title={known ? scene.titulo : "Caminho ainda não explorado"}
            >
              {known ? (
                <>
                  <span className={styles.nodeTitle}>{scene.titulo}</span>
                  {scene.fim && <span className={styles.nodeTag}>{scene.fim === "vitoria" ? "Vitória" : scene.fim === "parcial" ? "Final" : "Derrota"}</span>}
                </>
              ) : (
                <Icon name="lock" size={16} />
              )}
            </div>
          );
        })}
      </div>
      <p className={styles.legend}>Cenas abertas são as que você já viveu em alguma partida; as trancadas são caminhos que você ainda não tomou. Jogue de novo para abrir mais.</p>
    </div>
  );
}
