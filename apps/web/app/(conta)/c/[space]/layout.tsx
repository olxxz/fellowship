import type { ReactNode } from "react";
import { AccountPanel } from "@/components/account/AccountPanel";
import { AccountRail } from "@/components/account/AccountRail";
import { AccountSpaceSidebar } from "@/components/account/AccountSpaceSidebar";
import { toRailSpaces } from "@/components/account/railSpaces";
import { AppShell } from "@/components/shell/AppShell";
import { getChannelUnread, getMySpaces, getSpaceCampaigns, getSpaceUnread, getSpaceView, requireAccount } from "@/lib/app/queries";
import { appHomeHref, createSpaceHref } from "@/lib/routes";

export default async function SpaceLayout({ children, params }: { children: ReactNode; params: Promise<{ space: string }> }) {
  const { space: spaceId } = await params;
  const { supabase, profile } = await requireAccount(`/c/${spaceId}`);
  const [spaces, view, spaceUnread, channelUnread, campaigns] = await Promise.all([
    getMySpaces(supabase),
    getSpaceView(supabase, spaceId),
    getSpaceUnread(supabase),
    getChannelUnread(supabase, spaceId),
    getSpaceCampaigns(supabase, spaceId, profile.id),
  ]);
  return (
    <AppShell
      rail={<AccountRail homeHref={appHomeHref} createHref={createSpaceHref} spaces={toRailSpaces(spaces)} initial={spaceUnread} activeSpaceId={spaceId} />}
      panel={<AccountPanel profile={profile} />}
      sidebar={
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
      }
    >
      {children}
    </AppShell>
  );
}
