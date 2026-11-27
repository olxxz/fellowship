import { redirect } from "next/navigation";
import { loadCampaign } from "@/lib/app/campaign-context";
import { campaignAppHref } from "@/lib/routes";

export default async function CampaignHome({ params }: { params: Promise<{ space: string; campaign: string }> }) {
  const { space, campaign } = await params;
  const c = await loadCampaign(space, campaign, `/c/${space}/k/${campaign}`);
  const mesa = c.channels.find((ch) => ch.kind === "texto");
  redirect(campaignAppHref(space, campaign, mesa ? mesa.id : "personagens"));
}
