import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SpaceShell } from "@/components/shell/SpaceShell";
import { spaceById } from "@/lib/demo/data";

// Os parâmetros são gerados de baixo para cima: cada página lista as combinações completas (Cenário, campanha, canal).

export default async function SpaceLayout({ children, params }: { children: ReactNode; params: Promise<{ space: string }> }) {
  const { space } = await params;
  if (!spaceById(space)) notFound();
  return <SpaceShell spaceId={space}>{children}</SpaceShell>;
}
