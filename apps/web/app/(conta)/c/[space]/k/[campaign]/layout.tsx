import type { ReactNode } from "react";
import { CampaignNav } from "@/components/campaign/CampaignNav";
import { CampaignJoin } from "@/components/campaign/CampaignJoin";
import { loadCampaign } from "@/lib/app/campaign-context";

type Params = Promise<{ space: string; campaign: string }>;

/** Campanha: abas no topo (canais da campanha, Personagens, Membros, Ajustes). Quem não joga vê como entrar. */
export default async function CampaignLayout({ children, params }: { children: ReactNode; params: Params }) {
  const { space, campaign: campaignId } = await params;
  const c = await loadCampaign(space, campaignId, `/c/${space}/k/${campaignId}`);
  return (
    <>
      <CampaignNav spaceId={space} campaign={c.campaign} channels={c.channels} isMaster={c.isMaster} role={c.myRole} />
      {c.myRole ? children : <CampaignJoin spaceId={space} campaign={c.campaign} masters={c.members.filter((m) => m.role === "mestre").map((m) => c.profiles[m.user_id]?.display_name ?? "Mestre")} />}
    </>
  );
}
