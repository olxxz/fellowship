"use client";

import { Tabs } from "@fellowship/ui";
import { usePathname, useRouter } from "next/navigation";
import type { ReactElement } from "react";

/** Abas das configurações; a aba aberta fica no endereço (?aba=), para voltar nela ao recarregar. */
export function SettingsTabs({ tabs, initial }: { tabs: Array<{ id: string; label: string; content: ReactElement }>; initial: string }) {
  const router = useRouter();
  const path = usePathname();
  return (
    <Tabs.Root defaultValue={initial} onValueChange={(v) => router.replace(`${path}?aba=${v}`, { scroll: false })}>
      <Tabs.List aria-label="Seções das configurações">
        {tabs.map((t) => (
          <Tabs.Tab key={t.id} value={t.id}>
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {tabs.map((t) => (
        <Tabs.Panel key={t.id} value={t.id}>
          <div style={{ maxWidth: 720, paddingTop: "var(--space-4)" }}>{t.content}</div>
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}
