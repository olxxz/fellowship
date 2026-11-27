import type { CustomSheetTemplate } from "@fellowship/db";
import { EmptyState } from "@/components/common/EmptyState";
import { CampaignSettings } from "@/components/campaign/CampaignSettings";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { loadCampaign } from "@/lib/app/campaign-context";

export default async function CampaignSettingsPage({ params }: { params: Promise<{ space: string; campaign: string }> }) {
  const { space, campaign } = await params;
  const c = await loadCampaign(space, campaign, `/c/${space}/k/${campaign}/ajustes`);
  const header = <ContentHeader icon="settings" title="Ajustes" topic={c.campaign.name} />;
  if (!c.isMaster)
    return (
      <>
        {header}
        <EmptyState icon="lock" title="Só o mestre mexe nos ajustes" />
      </>
    );
  const { data: mine } = await c.supabase.from("sheet_templates").select("id, owner_id, name, base, config, updated_at").eq("owner_id", c.profile.id).order("updated_at", { ascending: false });
  return (
    <>
      {header}
      <CampaignSettings spaceId={space} campaign={c.campaign} model={c.model} myTemplates={(mine ?? []) as CustomSheetTemplate[]} />
    </>
  );
}
