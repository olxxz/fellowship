import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { AccountRail } from "./AccountRail";
import { getDirectUnread, getFriendsView, getMySpaces, getSpaceUnread, requireAccount } from "@/lib/app/queries";
import { appHomeHref, createSpaceHref } from "@/lib/routes";
import { AccountHomeSidebar } from "./AccountHomeSidebar";
import { AccountPanel } from "./AccountPanel";
import { toRailSpaces } from "./railSpaces";

/** Casca do Início e de "Criar Cenário": barra com os Cenários da conta e a barra pessoal. */
export async function HomeFrame({ children }: { children: ReactNode }) {
  const { supabase, profile } = await requireAccount();
  const [spaces, friends, spaceUnread, directUnread] = await Promise.all([getMySpaces(supabase), getFriendsView(supabase, profile.id), getSpaceUnread(supabase), getDirectUnread(supabase)]);
  return (
    <AppShell rail={<AccountRail homeHref={appHomeHref} createHref={createSpaceHref} spaces={toRailSpaces(spaces)} initial={spaceUnread} />} sidebar={<AccountHomeSidebar friends={friends.friends} incoming={friends.incoming.length} initialUnread={directUnread} />} panel={<AccountPanel profile={profile} />}>
      {children}
    </AppShell>
  );
}
