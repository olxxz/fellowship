import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Rail } from "@/components/shell/Rail";
import { getMySpaces, requireAccount } from "@/lib/app/queries";
import { appHomeHref, createSpaceHref } from "@/lib/routes";
import { AccountHomeSidebar } from "./AccountHomeSidebar";
import { AccountPanel } from "./AccountPanel";
import { toRailSpaces } from "./railSpaces";

/** Casca do Início e de "Criar Cenário": barra com os Cenários da conta e a barra pessoal. */
export async function HomeFrame({ children }: { children: ReactNode }) {
  const { supabase, profile } = await requireAccount();
  const spaces = await getMySpaces(supabase);
  return (
    <AppShell rail={<Rail homeHref={appHomeHref} createHref={createSpaceHref} spaces={toRailSpaces(spaces)} />} sidebar={<AccountHomeSidebar />} panel={<AccountPanel profile={profile} />}>
      {children}
    </AppShell>
  );
}
