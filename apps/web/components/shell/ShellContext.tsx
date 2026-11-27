"use client";

import { createContext, useContext } from "react";

export interface ShellState {
  /** Gaveta da navegação no celular. */
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Lista de membros no desktop (salva por pessoa). */
  membersOpen: boolean;
  setMembersOpen: (open: boolean) => void;
  /** Lista de membros no celular: gaveta da direita, fechada por padrão. */
  mobileMembersOpen: boolean;
  setMobileMembersOpen: (open: boolean) => void;
}

export const ShellContext = createContext<ShellState | null>(null);

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell precisa do AppShell");
  return ctx;
}

// Trocar de Cenário pela barra da esquerda monta outra casca (outro layout). No celular, a gaveta
// continua aberta do outro lado para a pessoa escolher o canal ou a conversa sem arrastar de novo.
let keepDrawer = false;
export const keepDrawerOpen = () => {
  keepDrawer = true;
};
export const takeKeepDrawer = () => {
  const v = keepDrawer;
  keepDrawer = false;
  return v;
};
