import { AccountSpaceSidebar } from "@/components/account/AccountSpaceSidebar";
import { getChannelUnread, getSpaceCampaigns, getSpaceView, requireAccount } from "@/lib/app/queries";

/** Barra lateral de um Cenário (canais, campanhas). Troca quando o Cenário muda; entre canais, fica. */
export default async function SpaceSidebarSlot({ params }: { params: Promise<{ space: string }> }) {
  const { space: spaceId } = await params;
  const { supabase, profile } = await requireAccount(`/c/${spaceId}`);
  const [view, channelUnread, campaigns] = await Promise.all([getSpaceView(supabase, spaceId), getChannelUnread(supabase, spaceId), getSpaceCampaigns(supabase, spaceId, profile.id)]);
  return (
    <AccountSpaceSidebar
      space={view.space}
      categories={view.categories}
      channels={view.channels}
      permissions={view.permissions}
      meId={profile.id}
      memberIds={view.members.map((m) => m.user_id)}
      campaigns={campaigns}
      initialUnread={channelUnread}
    />
  );
}
