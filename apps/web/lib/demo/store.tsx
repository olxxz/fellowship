"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { characterById, seedMessages, userById, type DemoCharacter, type DemoMessage, type DemoUser } from "./data";

export type Viewer = "jogador" | "mestre";

type NewMessage = DemoMessage extends infer M ? (M extends DemoMessage ? Omit<M, "id" | "time"> : never) : never;

interface DemoState {
  messages: Record<string, DemoMessage[]>;
  /** Envia uma mensagem. Texto aparece na hora como "enviando" e é confirmado depois (envio otimista). */
  send: (channelKey: string, message: NewMessage) => void;
  /** Ver o protótipo como jogador (Ana, que joga Kael) ou como mestre (Rafa). */
  viewer: Viewer;
  setViewer: (viewer: Viewer) => void;
  me: DemoUser;
  myCharacter: DemoCharacter;
}

const DemoContext = createContext<DemoState | null>(null);

let counter = 0;
const now = () => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date());

export function DemoProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState(seedMessages);
  const [viewer, setViewer] = useState<Viewer>("jogador");

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
      viewer,
      setViewer,
      me: userById(viewer === "mestre" ? "rafa" : "ana")!,
      myCharacter: characterById(viewer === "mestre" ? "narrador" : "kael")!,
    }),
    [messages, send, viewer],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo precisa do DemoProvider");
  return ctx;
}
