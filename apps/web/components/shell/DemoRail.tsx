"use client";

import { spaces } from "@/lib/demo/data";
import { demoHomeHref, spaceHref } from "@/lib/routes";
import { Rail } from "./Rail";

/** Barra de Cenários do protótipo, com os Cenários de exemplo. */
export function DemoRail({ activeSpaceId }: { activeSpaceId?: string }) {
  return (
    <Rail
      homeHref={demoHomeHref}
      activeSpaceId={activeSpaceId}
      spaces={spaces.map((s) => ({ id: s.id, name: s.name, short: s.short, color: s.color, href: spaceHref(s.id, "geral") }))}
    />
  );
}
