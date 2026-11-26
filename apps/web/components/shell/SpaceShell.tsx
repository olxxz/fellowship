"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { campaignById, spaceById } from "@/lib/demo/data";
import { AppShell } from "./AppShell";
import { CampaignSidebar } from "./CampaignSidebar";
import { Rail } from "./Rail";
import { SpaceSidebar } from "./SpaceSidebar";

/** Casca dentro de um Cenário: troca para a barra da campanha quando a rota entra numa campanha. */
export function SpaceShell({ spaceId, children }: { spaceId: string; children: ReactNode }) {
  const params = useParams<{ campaign?: string; channel?: string }>();
  const space = spaceById(spaceId)!;
  const campaign = params.campaign ? campaignById(space, params.campaign) : undefined;

  const sidebar = campaign ? (
    <CampaignSidebar space={space} campaign={campaign} activeChannelId={params.channel ?? "mesa"} />
  ) : (
    <SpaceSidebar space={space} activeChannelId={params.channel} />
  );

  return (
    <AppShell rail={<Rail activeSpaceId={spaceId} />} sidebar={sidebar}>
      {children}
    </AppShell>
  );
}
