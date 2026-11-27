"use client";

import type { PresenceStatus } from "@fellowship/ui";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useOptionalVoice } from "@/lib/livekit/VoiceProvider";
import { getBrowserClient } from "@/lib/supabase/client";

// Presença em tempo real (Supabase Realtime Presence): um canal por Cenário da conta.
// Cada pessoa anuncia "online", "ausente" (aba escondida ou sem mexer há 10 min) ou "em-sessao" (numa sala de voz).

const PresenceContext = createContext<Record<string, PresenceStatus>>({});

/** Status de cada pessoa visível agora (quem não aparece está offline). */
export const usePresenceMap = () => useContext(PresenceContext);

const RANK: Record<PresenceStatus, number> = { "em-sessao": 3, online: 2, ausente: 1, offline: 0 };
const IDLE_MS = 10 * 60 * 1000;

export function PresenceProvider({ children }: { children: ReactNode }) {
  const voice = useOptionalVoice();
  const inVoice = voice?.status === "on";
  const [map, setMap] = useState<Record<string, PresenceStatus>>({});
  const [away, setAway] = useState(false);
  const channels = useRef<RealtimeChannel[]>([]);
  const statusRef = useRef<PresenceStatus>("online");
  const status: PresenceStatus = inVoice ? "em-sessao" : away ? "ausente" : "online";

  // Ausente: aba escondida, ou sem teclado/mouse/toque por 10 minutos.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const active = () => {
      setAway(document.visibilityState !== "visible");
      clearTimeout(timer);
      timer = setTimeout(() => setAway(true), IDLE_MS);
    };
    active();
    const events = ["pointerdown", "keydown", "visibilitychange", "focus"] as const;
    events.forEach((e) => window.addEventListener(e, active, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, active));
    };
  }, []);

  useEffect(() => {
    const supabase = getBrowserClient();
    let disposed = false;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const me = data.session?.user.id;
      if (!me || disposed) return;
      await supabase.realtime.setAuth(data.session!.access_token);
      const { data: spaces } = await supabase.from("space_members").select("space_id").eq("user_id", me);
      if (disposed) return;
      const recompute = () => {
        const next: Record<string, PresenceStatus> = {};
        for (const ch of channels.current) {
          for (const [userId, metas] of Object.entries(ch.presenceState<{ status: PresenceStatus }>())) {
            for (const m of metas) if (!next[userId] || RANK[m.status] > RANK[next[userId]!]) next[userId] = m.status;
          }
        }
        setMap(next);
      };
      channels.current = (spaces ?? []).map(({ space_id }) => {
        const ch = supabase.channel(`presenca:${space_id}`, { config: { presence: { key: me } } });
        ch.on("presence", { event: "sync" }, recompute).subscribe((s) => {
          if (s === "SUBSCRIBED") void ch.track({ status: statusRef.current });
        });
        return ch;
      });
    })();
    return () => {
      disposed = true;
      channels.current.forEach((ch) => void supabase.removeChannel(ch));
      channels.current = [];
    };
  }, []);

  // Muda o status anunciado em todos os Cenários.
  useEffect(() => {
    statusRef.current = status;
    channels.current.forEach((ch) => void ch.track({ status }).catch(() => {}));
  }, [status]);

  return <PresenceContext.Provider value={map}>{children}</PresenceContext.Provider>;
}
