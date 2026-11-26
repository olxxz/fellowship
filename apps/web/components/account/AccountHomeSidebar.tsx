"use client";

import { Avatar, ChannelCategory, ChannelRow, cx } from "@fellowship/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PendingLink } from "@/components/nav/PendingLink";
import { useShell } from "@/components/shell/ShellContext";
import styles from "@/components/shell/Sidebar.module.sass";
import { appHomeHref, createSpaceHref, dmHref, exploreHref, friendsHref } from "@/lib/routes";

export interface SidebarFriend {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  color: string;
}

/** Barra do Início: área pessoal, Explorar, amigos e as conversas diretas. */
export function AccountHomeSidebar({ friends, incoming }: { friends: SidebarFriend[]; incoming: number }) {
  const path = usePathname();
  const { closeDrawer } = useShell();
  return (
    <div className={styles.sidebar}>
      <div className={styles.scroll}>
        <ChannelCategory name="Início">
          <ChannelRow icon="home" name="Seus Cenários" href={appHomeHref} linkAs={PendingLink} active={path === appHomeHref} onClick={closeDrawer} />
          <ChannelRow icon="map" name="Explorar" href={exploreHref} linkAs={PendingLink} active={path === exploreHref} onClick={closeDrawer} />
          <ChannelRow
            icon="users"
            name="Amigos"
            href={friendsHref}
            linkAs={PendingLink}
            active={path === friendsHref}
            onClick={closeDrawer}
            unread={incoming > 0}
            meta={incoming > 0 ? `${incoming} ${incoming === 1 ? "pedido" : "pedidos"}` : undefined}
          />
          <ChannelRow icon="plus" name="Criar Cenário" href={createSpaceHref} linkAs={PendingLink} active={path === createSpaceHref} onClick={closeDrawer} />
        </ChannelCategory>
        <ChannelCategory name="Mensagens diretas">
          {friends.length === 0 ? (
            <p className={styles.note}>
              Adicione amigos em <Link href={friendsHref}>Amigos</Link> para conversar.
            </p>
          ) : (
            friends.map((f) => {
              const href = dmHref(f.username);
              return (
                <PendingLink key={f.id} href={href} className={cx(styles.dmRow, path === href && styles.dmRowActive)} aria-current={path === href ? "page" : undefined} onClick={closeDrawer}>
                  <Avatar name={f.display_name} src={f.avatar_url ?? undefined} color={f.color} size={28} />
                  <span className={styles.dmName}>{f.display_name}</span>
                </PendingLink>
              );
            })
          )}
        </ChannelCategory>
      </div>
    </div>
  );
}
