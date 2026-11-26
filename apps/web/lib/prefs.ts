"use client";

import { useCallback, useSyncExternalStore } from "react";

// Preferências por pessoa, salvas no navegador (painéis abertos, tema).
// localStorage pode falhar (aba anônima, bloqueio): tudo tem valor padrão e try/catch.

const PREFIX = "fellowship:";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string) {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // sem armazenamento: a escolha vale só nesta visita
  }
  listeners.forEach((l) => l());
}

/** Preferência em texto, com valor padrão. No servidor, sempre o padrão. */
export function usePref<T extends string>(key: string, fallback: T): [T, (value: T) => void] {
  const stored = useSyncExternalStore(subscribe, () => read(key), () => null);
  const set = useCallback((value: T) => writePref(key, value), [key]);
  return [(stored as T | null) ?? fallback, set];
}

/** Preferência liga/desliga. */
export function useFlag(key: string, fallback: boolean): [boolean, (value: boolean) => void] {
  const [value, set] = usePref(key, fallback ? "1" : "0");
  const setFlag = useCallback((v: boolean) => set(v ? "1" : "0"), [set]);
  return [value === "1", setFlag];
}
