"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Rail, type RailSpace } from "@/components/shell/Rail";
import { getBrowserClient } from "@/lib/supabase/client";

type Counts = Record<string, { unread: number; mentions: number }>;

/** Barra de Cenários do app real, com não lidas e menções atualizadas (a cada 20 s, ao voltar para a aba e ao ler um canal). */
export function AccountRail({ spaces, initial, ...rest }: { spaces: RailSpace[]; initial: Counts; homeHref: string; createHref: string }) {
  // O Cenário ativo vem da URL: a barra fica montada entre as páginas e acompanha a navegação.
  const { space: activeSpaceId } = useParams<{ space?: string }>();
  const [counts, setCounts] = useState(initial);
  const load = useCallback(async () => {
    const { data } = await getBrowserClient().rpc("space_unread");
    if (!data) return;
    setCounts(Object.fromEntries((data as { space_id: string; unread: number; mentions: number }[]).map((r) => [r.space_id, { unread: r.unread, mentions: r.mentions }])));
  }, []);
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && void load(), 20_000);
    const onRead = () => setTimeout(() => void load(), 400);
    const onVisible = () => document.visibilityState === "visible" && void load();
    window.addEventListener("fellowship:read", onRead);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      window.removeEventListener("fellowship:read", onRead);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);
  return <Rail {...rest} activeSpaceId={activeSpaceId} spaces={spaces.map((s) => ({ ...s, unread: (counts[s.id]?.unread ?? 0) > 0, mentions: counts[s.id]?.mentions ?? 0 }))} />;
}
