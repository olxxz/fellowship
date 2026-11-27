"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

type Counts = Record<string, { unread: number; mentions: number }>;

/**
 * Não lidas por canal do Cenário: começa com o que veio do servidor, soma as mensagens novas que chegam
 * em tempo real (de outras pessoas, em outros canais) e zera o canal aberto.
 */
export function useChannelUnread(spaceId: string, meId: string, activeId: string | undefined, initial: Counts) {
  const [counts, setCounts] = useState(initial);
  const [lastActive, setLastActive] = useState(activeId);
  if (activeId !== lastActive) {
    setLastActive(activeId);
    if (activeId && counts[activeId]) setCounts(({ [activeId]: _, ...rest }) => rest);
  }

  useEffect(() => {
    const supabase = getBrowserClient();
    const sub = supabase
      .channel(`naolidas:${spaceId}:${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `space_id=eq.${spaceId}` }, (p) => {
        const m = p.new as { channel_id: string; author_id: string; mentions?: string[] };
        if (m.author_id === meId || location.pathname.endsWith(`/${m.channel_id}`)) return;
        setCounts((all) => {
          const cur = all[m.channel_id] ?? { unread: 0, mentions: 0 };
          return { ...all, [m.channel_id]: { unread: cur.unread + 1, mentions: cur.mentions + (m.mentions?.includes(meId) ? 1 : 0) } };
        });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(sub);
    };
  }, [spaceId, meId]);

  return counts;
}
