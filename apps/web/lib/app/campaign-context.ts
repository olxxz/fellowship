import "server-only";
import type { CampaignRole } from "@fellowship/db";
import { getCampaignView, getSpaceView, requireAccount } from "@/lib/app/queries";

/** Dados comuns das páginas da campanha (com cache por requisição). */
export async function loadCampaign(spaceId: string, campaignId: string, next: string) {
  const { supabase, profile } = await requireAccount(next);
  const [space, view] = await Promise.all([getSpaceView(supabase, spaceId), getCampaignView(supabase, campaignId)]);
  const isOwner = space.space.owner_id === profile.id;
  const myRole: CampaignRole | null = isOwner ? "mestre" : (view.members.find((m) => m.user_id === profile.id)?.role ?? null);
  const profiles = Object.fromEntries(space.members.map((m) => [m.user_id, m.profile]));
  return { supabase, profile, space, ...view, myRole, isMaster: myRole === "mestre", profiles };
}
