"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";
import { CHANNEL_COLUMNS, type ChatMsg } from "@/lib/chat/source";
import { getBrowserClient } from "@/lib/supabase/client";

/**
 * Mensagens novas de um canal, para a Mesa reagir (bolhas no palco, dados 3D) mesmo com o chat fechado.
 * Tempo real com reserva por consulta a cada 4 s (quando o tempo real cai, nada se perde).
 */
export function useMesaFeed(channelId: string | undefined, onMessage: (m: ChatMsg) => void) {
  const handler = useRef(onMessage);
  useEffect(() => {
    handler.current = onMessage;
  });

  useEffect(() => {
    if (!channelId) return;
    const supabase = getBrowserClient();
    const seen = new Set<string>();
    let since = new Date().toISOString();
    let live = false;
    let sub: RealtimeChannel | null = null;
    let disposed = false;

    const deliver = (m: ChatMsg) => {
      if (seen.has(m.id)) return;
      seen.add(m.id);
      if (m.created_at > since) since = m.created_at;
      handler.current(m);
    };
    const catchUp = async () => {
      const { data } = await supabase.from("messages").select(CHANNEL_COLUMNS).eq("channel_id", channelId).gt("created_at", since).order("created_at").limit(20);
      if (!disposed) for (const m of (data ?? []) as unknown as ChatMsg[]) deliver(m);
    };

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (disposed) return;
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      sub = supabase
        .channel(`mesa:${channelId}:${crypto.randomUUID()}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` }, (p) => deliver(p.new as ChatMsg))
        .subscribe((status) => {
          live = status === "SUBSCRIBED";
        });
    })();
    const poll = setInterval(() => {
      if (!live && document.visibilityState === "visible") void catchUp();
    }, 4000);
    return () => {
      disposed = true;
      clearInterval(poll);
      if (sub) void supabase.removeChannel(sub);
    };
  }, [channelId]);
}
