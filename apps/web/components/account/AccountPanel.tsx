"use client";

import { Avatar, IconButton, Menu } from "@fellowship/ui";
import Link from "next/link";
import { useRef } from "react";
import styles from "@/components/shell/UserPanel.module.sass";
import { ThemeMenuGroup } from "@/components/shell/ThemeMenuGroup";
import { campaignHref } from "@/lib/routes";

export interface AccountProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  color: string;
}

/** Painel da conta no rodapé da barra lateral: quem está logado, tema e sair. */
export function AccountPanel({ profile }: { profile: AccountProfile }) {
  const logout = useRef<HTMLFormElement>(null);
  return (
    <div className={styles.panel}>
      <Avatar name={profile.display_name} src={profile.avatar_url ?? undefined} color={profile.color} size={36} />
      <div className={styles.who}>
        <span className={styles.name}>{profile.display_name}</span>
        <span className={styles.status}>Conectado</span>
      </div>
      <Menu.Root>
        <Menu.Trigger render={<IconButton icon="settings" label="Configurações" />} />
        <Menu.Popup side="top" align="end">
          <Menu.LinkItem render={<Link href="/conta" />}>Meu perfil</Menu.LinkItem>
          <Menu.Separator />
          <ThemeMenuGroup />
          <Menu.Separator />
          <Menu.LinkItem render={<Link href={campaignHref("vel", "maldicao")} />}>Protótipo da Mesa</Menu.LinkItem>
          <Menu.LinkItem render={<Link href="/design-system" />}>Design system</Menu.LinkItem>
          <Menu.Separator />
          <Menu.Item onClick={() => logout.current?.requestSubmit()}>Sair da conta</Menu.Item>
        </Menu.Popup>
      </Menu.Root>
      <form ref={logout} action="/auth/sair" method="post" hidden />
    </div>
  );
}
