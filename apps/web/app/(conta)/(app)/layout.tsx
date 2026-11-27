import type { ReactNode } from "react";
import { AccountPanel } from "@/components/account/AccountPanel";
import { AccountRail } from "@/components/account/AccountRail";
import { toRailSpaces } from "@/components/account/railSpaces";
import { AppShell } from "@/components/shell/AppShell";
import { getMySpaces, getSpaceUnread, requireAccount } from "@/lib/app/queries";
import { appHomeHref, createSpaceHref } from "@/lib/routes";

/**
 * Casca do app logado, comum ao Início e a todos os Cenários: a barra de Cenários e o painel da conta ficam
 * montados ao trocar de Cenário ou ir para o Início (não recarregam nem piscam). Só a barra lateral (o slot
 * `sidebar`) e o conteúdo trocam conforme a página.
 */
export default async function AppLayout({ children, sidebar }: { children: ReactNode; sidebar: ReactNode }) {
  const { supabase, profile } = await requireAccount();
  const [spaces, spaceUnread] = await Promise.all([getMySpaces(supabase), getSpaceUnread(supabase)]);
  return (
    <AppShell rail={<AccountRail homeHref={appHomeHref} createHref={createSpaceHref} spaces={toRailSpaces(spaces)} initial={spaceUnread} />} sidebar={sidebar} panel={<AccountPanel profile={profile} />}>
      {children}
    </AppShell>
  );
}
