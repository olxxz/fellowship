import type { ReactNode } from "react";
import { AccountSpaceSidebar } from "@/components/account/AccountSpaceSidebar";
import { toRailSpaces } from "@/components/account/railSpaces";
import { AppShell } from "@/components/shell/AppShell";
import { Rail } from "@/components/shell/Rail";
import { getMySpaces, getSpaceView, requireAccount } from "@/lib/app/queries";
import { appHomeHref, createSpaceHref } from "@/lib/routes";

export default async function SpaceLayout({ children, params }: { children: ReactNode; params: Promise<{ space: string }> }) {
  const { space: spaceId } = await params;
  const { supabase, profile } = await requireAccount(`/c/${spaceId}`);
  const [spaces, view] = await Promise.all([getMySpaces(supabase), getSpaceView(supabase, spaceId)]);
  return (
    <AppShell
      rail={<Rail homeHref={appHomeHref} createHref={createSpaceHref} spaces={toRailSpaces(spaces)} activeSpaceId={spaceId} />}
      sidebar={<AccountSpaceSidebar space={view.space} categories={view.categories} channels={view.channels} profile={profile} />}
    >
      {children}
    </AppShell>
  );
}
