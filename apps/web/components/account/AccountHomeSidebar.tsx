"use client";

import { ChannelCategory, ChannelRow } from "@fellowship/ui";
import { PendingLink } from "@/components/nav/PendingLink";
import { usePathname } from "next/navigation";
import { useShell } from "@/components/shell/ShellContext";
import styles from "@/components/shell/Sidebar.module.sass";
import { appHomeHref, createSpaceHref } from "@/lib/routes";
import { AccountPanel, type AccountProfile } from "./AccountPanel";

/** Barra do Início: área pessoal. Amigos e mensagens diretas chegam na fase 3. */
export function AccountHomeSidebar({ profile }: { profile: AccountProfile }) {
  const path = usePathname();
  const { closeDrawer } = useShell();
  return (
    <div className={styles.sidebar}>
      <div className={styles.scroll}>
        <ChannelCategory name="Início">
          <ChannelRow icon="home" name="Seus Cenários" href={appHomeHref} linkAs={PendingLink} active={path === appHomeHref} onClick={closeDrawer} />
          <ChannelRow icon="plus" name="Criar Cenário" href={createSpaceHref} linkAs={PendingLink} active={path === createSpaceHref} onClick={closeDrawer} />
          <ChannelRow icon="settings" name="Meu perfil" href="/conta" linkAs={PendingLink} active={path === "/conta"} onClick={closeDrawer} />
          <ChannelRow icon="users" name="Amigos" meta="fase 3" />
          <ChannelRow icon="chat" name="Mensagens diretas" meta="fase 3" />
        </ChannelCategory>
      </div>
      <AccountPanel profile={profile} />
    </div>
  );
}
