"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePref } from "@/lib/prefs";
import { characterById, characters, seedMessages, userById, users, type DemoCharacter, type DemoMessage, type DemoUser } from "./data";

export type Viewer = "jogador" | "mestre";

type NewMessage = DemoMessage extends infer M ? (M extends DemoMessage ? Omit<M, "id" | "time"> : never) : never;

interface DemoState {
  messages: Record<string, DemoMessage[]>;
  /** Envia uma mensagem. Texto aparece na hora como "enviando" e é confirmado depois (envio otimista). */
  send: (channelKey: string, message: NewMessage) => void;
  /** Quem está usando: um dos usuários do grupo (sem login ainda). Fica salvo no navegador. */
  meId: string;
  setMeId: (id: string) => void;
  /** Derivado de quem está usando: Rafa mestra a campanha; os outros jogam. */
  viewer: Viewer;
  me: DemoUser;
  myCharacter: DemoCharacter;
}

/** Quem mestra a campanha de exemplo. */
const MASTER_ID = "rafa";

/** Quem pode ser escolhido no protótipo: os que estão na campanha ao vivo. */
export const selectableUsers = users.filter((u) => u.role === "narrador" || u.role === "mesa");

const DemoContext = createContext<DemoState | null>(null);

let counter = 0;
const now = () => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date());

export function DemoProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState(seedMessages);
  const [storedId, setMeId] = usePref<string>("eu", "ana");
  const meId = userById(storedId) ? storedId : "ana";
  const viewer: Viewer = meId === MASTER_ID ? "mestre" : "jogador";

  const send = useCallback((key: string, message: NewMessage) => {
    const id = `m-${++counter}`;
    const pending = message.type === "text";
    const full = { ...message, id, time: now(), ...(pending && { pending: true }) } as DemoMessage;
    setMessages((all) => ({ ...all, [key]: [...(all[key] ?? []), full] }));
    if (pending) {
      // No app de verdade, a confirmação vem do Supabase Realtime.
      window.setTimeout(() => {
        setMessages((all) => ({
          ...all,
          [key]: (all[key] ?? []).map((m) => (m.id === id && m.type === "text" ? { ...m, pending: false } : m)),
        }));
      }, 700);
    }
  }, []);

  const value = useMemo<DemoState>(
    () => ({
      messages,
      send,
      meId,
      setMeId,
      viewer,
      me: userById(meId)!,
      myCharacter: characters.find((c) => c.ownerId === meId) ?? characterById("narrador")!,
    }),
    [messages, send, meId, setMeId, viewer],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo precisa do DemoProvider");
  return ctx;
}
