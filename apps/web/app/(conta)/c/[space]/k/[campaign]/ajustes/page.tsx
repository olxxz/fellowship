import { EmptyState } from "@/components/common/EmptyState";
import { CampaignSettings } from "@/components/campaign/CampaignSettings";
import { loadCampaign } from "@/lib/app/campaign-context";

export default async function CampaignSettingsPage({ params }: { params: Promise<{ space: string; campaign: string }> }) {
  const { space, campaign } = await params;
  const c = await loadCampaign(space, campaign, `/c/${space}/k/${campaign}/ajustes`);
  if (!c.isMaster) return <EmptyState icon="lock" title="Só o mestre mexe nos ajustes" />;
  return <CampaignSettings spaceId={space} campaign={c.campaign} />;
}
