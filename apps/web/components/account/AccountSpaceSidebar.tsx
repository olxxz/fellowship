"use client";

import { ChannelCategory, ChannelRow, playerColorStyle, type PlayerColor } from "@fellowship/ui";
import type { Category, Channel, Space } from "@fellowship/db";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useShell } from "@/components/shell/ShellContext";
import styles from "@/components/shell/Sidebar.module.sass";
import { channelIcon } from "@/lib/app/channels";
import { appSpaceHref, campaignHref } from "@/lib/routes";
import { AccountPanel, type AccountProfile } from "./AccountPanel";

/** Barra do Cenário real: só os canais que a conta pode ver (o banco já filtra pelo RLS). */
export function AccountSpaceSidebar({ space, categories, channels, profile }: { space: Space; categories: Category[]; channels: Channel[]; profile: AccountProfile }) {
  const { channel: activeId } = useParams<{ channel?: string }>();
  const { closeDrawer } = useShell();

  const row = (c: Channel) => (
    <ChannelRow key={c.id} icon={channelIcon(c)} name={c.name} active={c.id === activeId} href={appSpaceHref(space.id, c.id)} linkAs={Link} onClick={closeDrawer} />
  );
  const loose = channels.filter((c) => !c.category_id);
  const groups = categories.map((cat) => ({ cat, items: channels.filter((c) => c.category_id === cat.id) })).filter((g) => g.items.length > 0);

  return (
    <div className={styles.sidebar}>
      <header className={styles.banner} style={playerColorStyle(space.color as PlayerColor)}>
        <h2 className={styles.bannerName}>{space.name}</h2>
        {space.description && <p className={styles.bannerSub}>{space.description}</p>}
      </header>
      <div className={styles.scroll}>
        {loose.length > 0 && <div>{loose.map(row)}</div>}
        {groups.map(({ cat, items }) => (
          <ChannelCategory key={cat.id} name={cat.name}>
            {items.map(row)}
          </ChannelCategory>
        ))}
        <ChannelCategory name="Campanhas">
          <p className={styles.note}>
            Campanhas chegam na fase 1. Enquanto isso,{" "}
            <Link href={campaignHref("vel", "maldicao")} style={{ color: "var(--accent-text)" }}>
              veja a Mesa no protótipo
            </Link>
            .
          </p>
        </ChannelCategory>
      </div>
      <AccountPanel profile={profile} />
    </div>
  );
}
