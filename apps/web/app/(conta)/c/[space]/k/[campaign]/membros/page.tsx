import { CampaignMembers } from "@/components/campaign/CampaignMembers";
import { loadCampaign } from "@/lib/app/campaign-context";

export default async function CampaignMembersPage({ params }: { params: Promise<{ space: string; campaign: string }> }) {
  const { space, campaign } = await params;
  const c = await loadCampaign(space, campaign, `/c/${space}/k/${campaign}/membros`);
  return (
    <CampaignMembers
      spaceId={space}
      campaignId={campaign}
      people={c.space.members.map((m) => ({ id: m.user_id, name: m.profile.display_name, username: m.profile.username, avatarUrl: m.profile.avatar_url, color: m.profile.color }))}
      roles={Object.fromEntries(c.members.map((m) => [m.user_id, m.role]))}
      ownerId={c.space.space.owner_id}
      meId={c.profile.id}
      isMaster={c.isMaster}
    />
  );
}
