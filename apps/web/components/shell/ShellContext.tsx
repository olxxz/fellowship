"use client";

import { createContext, useContext } from "react";

export interface ShellState {
  /** Gaveta da navegação no celular. */
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Lista de membros (salva por pessoa). */
  membersOpen: boolean;
  setMembersOpen: (open: boolean) => void;
}

export const ShellContext = createContext<ShellState | null>(null);

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell precisa do AppShell");
  return ctx;
}
