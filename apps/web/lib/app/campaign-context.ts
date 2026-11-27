import "server-only";
import type { CampaignRole, CampaignSession, CustomSheetTemplate } from "@fellowship/db";
import { sheetModel } from "@/lib/sheets/template";
import { getCampaignView, getSpaceView, requireAccount } from "@/lib/app/queries";

/** Dados comuns das páginas da campanha (com cache por requisição). */
export async function loadCampaign(spaceId: string, campaignId: string, next: string) {
  const { supabase, profile } = await requireAccount(next);
  const [space, view] = await Promise.all([getSpaceView(supabase, spaceId), getCampaignView(supabase, campaignId)]);
  const isOwner = space.space.owner_id === profile.id;
  const myRole: CampaignRole | null = isOwner ? "mestre" : (view.members.find((m) => m.user_id === profile.id)?.role ?? null);
  const profiles = Object.fromEntries(space.members.map((m) => [m.user_id, m.profile]));
  const [session, template] = await Promise.all([
    supabase.from("campaign_sessions").select("id, campaign_id, number, title, started_at, ended_at").eq("campaign_id", campaignId).is("ended_at", null).maybeSingle<CampaignSession>(),
    view.campaign.template_id
      ? supabase.from("sheet_templates").select("id, owner_id, name, base, config, updated_at").eq("id", view.campaign.template_id).maybeSingle<CustomSheetTemplate>()
      : Promise.resolve({ data: null }),
  ]);
  const model = sheetModel(view.campaign.system, template.data);
  return { supabase, profile, space, ...view, myRole, isMaster: myRole === "mestre", profiles, session: session.data, template: template.data, model };
}
