"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useParams, usePathname } from "next/navigation";
import { adventureById } from "@/lib/adventures";
import { startedIds, subscribeAdventures } from "@/lib/adventures/progress";
import { Rail, type RailSpace } from "@/components/shell/Rail";
import { getBrowserClient } from "@/lib/supabase/client";

type Counts = Record<string, { unread: number; mentions: number }>;

/** Barra de Cenários do app real, com não lidas e menções atualizadas (a cada 20 s, ao voltar para a aba e ao ler um canal). */
export function AccountRail({ spaces, initial, ...rest }: { spaces: RailSpace[]; initial: Counts; homeHref: string; createHref: string }) {
  // O Cenário (ou a aventura) ativo vem da URL: a barra fica montada entre as páginas e acompanha a navegação.
  const { space, adventure } = useParams<{ space?: string; adventure?: string }>();
  const path = usePathname();
  const started = useSyncExternalStore(subscribeAdventures, startedIds, () => "");
  const adventures = started
    .split(",")
    .map((id) => adventureById(id))
    .filter((a) => !!a)
    .map((a) => ({ id: a.id, name: a.titulo, short: a.sigla, color: a.cor, href: `/a/${a.id}` }));
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
  // Entrar e sair de um canal atualiza as bolinhas na hora (a leitura é marcada logo ao abrir).
  useEffect(() => {
    const t = setTimeout(() => void load(), 600);
    return () => clearTimeout(t);
  }, [path, load]);
  return <Rail {...rest} activeSpaceId={space ?? adventure} adventuresHref="/a" adventures={adventures} adventuresActive={path === "/a"} spaces={spaces.map((s) => ({ ...s, unread: (counts[s.id]?.unread ?? 0) > 0, mentions: counts[s.id]?.mentions ?? 0 }))} />;
}
