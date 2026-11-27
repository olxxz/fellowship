import type { ReactNode } from "react";
import { CampaignJoin } from "@/components/campaign/CampaignJoin";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { loadCampaign } from "@/lib/app/campaign-context";

type Params = Promise<{ space: string; campaign: string }>;

/** Campanha: a navegação fica na barra da campanha (à esquerda). Quem não joga vê como entrar. */
export default async function CampaignLayout({ children, params }: { children: ReactNode; params: Params }) {
  const { space, campaign: campaignId } = await params;
  const c = await loadCampaign(space, campaignId, `/c/${space}/k/${campaignId}`);
  if (c.myRole) return children;
  return (
    <>
      <ContentHeader icon="dice" title={c.campaign.name} topic={c.campaign.description ?? undefined} />
      <CampaignJoin spaceId={space} campaign={c.campaign} masters={c.members.filter((m) => m.role === "mestre").map((m) => c.profiles[m.user_id]?.display_name ?? "Mestre")} />
    </>
  );
}
