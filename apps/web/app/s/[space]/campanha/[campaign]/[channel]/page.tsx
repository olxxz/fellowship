import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignChannelView } from "@/components/channel/CampaignChannelView";
import { campaignById, campaignChannelIds, campaignChannelInfo, spaceById, spaces, type CampaignChannelId } from "@/lib/demo/data";

type Params = Promise<{ space: string; campaign: string; channel: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  const channels = campaignChannelIds.filter((id) => id !== "mesa");
  return spaces.flatMap((s) => s.campaigns.flatMap((c) => channels.map((channel) => ({ space: s.id, campaign: c.id, channel }))));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { space, campaign, channel } = await params;
  const s = spaceById(space);
  const c = s && campaignById(s, campaign);
  const info = campaignChannelInfo[channel as CampaignChannelId];
  return { title: info && c ? `${info.name} · ${c.name}` : "Campanha" };
}

export default async function CampaignChannelPage({ params }: { params: Params }) {
  const { space, campaign, channel } = await params;
  const s = spaceById(space);
  if (!s || !campaignById(s, campaign) || channel === "mesa" || !(channel in campaignChannelInfo)) notFound();
  return <CampaignChannelView spaceId={space} campaignId={campaign} channelId={channel as CampaignChannelId} />;
}
