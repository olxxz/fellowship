"use client";

import type { AdventureState } from "@fellowship/core";

// Progresso das aventuras neste aparelho (localStorage; pode falhar em aba anônima: tudo tem padrão).
// Depois vai para a conta, para continuar em outro aparelho.

export type AdventureCheck = { roll: number; bonus: number; total: number; cd: number; ok: boolean; stat: string };
export interface AdventureSave {
  state: AdventureState;
  check: AdventureCheck | null;
}
/** Tudo o que a pessoa já descobriu em todas as partidas (para a árvore de escolhas). */
export interface AdventureMap {
  cenas: string[];
  /** "de>para" de cada caminho já percorrido. */
  arestas: string[];
}

const SAVE = (id: string) => `fellowship:aventura:${id}`;
const MAP = (id: string) => `fellowship:aventura-mapa:${id}`;
const EVENT = "fellowship:aventura";
let version = 0;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sem armazenamento: vale só nesta visita
  }
}

export const loadSave = (id: string) => read<AdventureSave>(SAVE(id));
export const loadMap = (id: string): AdventureMap => read<AdventureMap>(MAP(id)) ?? { cenas: [], arestas: [] };

/** Salva a partida e soma ao mapa o que foi descoberto. */
export function storeSave(id: string, save: AdventureSave) {
  write(SAVE(id), save);
  const map = loadMap(id);
  const cenas = new Set(map.cenas);
  const arestas = new Set(map.arestas);
  save.state.caminho.forEach((c, i) => {
    cenas.add(c);
    if (i > 0) arestas.add(`${save.state.caminho[i - 1]}>${c}`);
  });
  write(MAP(id), { cenas: [...cenas], arestas: [...arestas] });
  version++;
  window.dispatchEvent(new Event(EVENT));
}

/** Ids das aventuras começadas (para a barra de Cenários). */
export function startedIds(): string {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith("fellowship:aventura:"))
      .map((k) => k.slice("fellowship:aventura:".length))
      .sort()
      .join(",");
  } catch {
    return "";
  }
}

export function subscribeAdventures(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Muda a cada gravação: para useSyncExternalStore reler mapa e partida. */
export const adventuresVersion = () => version;
