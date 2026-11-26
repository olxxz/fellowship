"use client";

import { CampaignCard, ChannelCategory, ChannelRow, playerColorStyle } from "@fellowship/ui";
import Link from "next/link";
import { characterById, type DemoSpace } from "@/lib/demo/data";
import { campaignHref, spaceHref } from "@/lib/routes";
import { useShell } from "./ShellContext";
import styles from "./Sidebar.module.sass";
import { UserPanel } from "./UserPanel";

/** Barra do Cenário: banner, canais por categoria e campanhas. */
export function SpaceSidebar({ space, activeChannelId }: { space: DemoSpace; activeChannelId?: string }) {
  const { closeDrawer } = useShell();
  const channel = (id: string) => space.channels.find((c) => c.id === id)!;

  return (
    <div className={styles.sidebar}>
      <header className={styles.banner} style={playerColorStyle(space.color)}>
        <h2 className={styles.bannerName}>{space.name}</h2>
        <p className={styles.bannerSub}>{space.description}</p>
      </header>
      <div className={styles.scroll}>
        {space.categories.map((category) => (
          <ChannelCategory key={category.name} name={category.name}>
            {category.channelIds.map((id) => {
              const c = channel(id);
              return (
                <ChannelRow
                  key={id}
                  icon={c.icon}
                  name={c.name}
                  meta={c.meta}
                  metaTone={c.metaTone}
                  unread={c.unread && id !== activeChannelId}
                  active={id === activeChannelId}
                  href={spaceHref(space.id, id)}
                  linkAs={Link}
                  onClick={closeDrawer}
                />
              );
            })}
          </ChannelCategory>
        ))}
        <ChannelCategory name="Campanhas">
          {space.campaigns.length === 0
            ? [<p key="vazio" className={styles.note}>Nenhuma campanha ainda.</p>]
            : space.campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  name={campaign.name}
                  icon={campaign.icon}
                  color={campaign.color}
                  live={
                    campaign.live && {
                      session: campaign.live.session,
                      participants: campaign.characterIds.map((id) => {
                        const ch = characterById(id)!;
                        return { name: ch.name, color: ch.color };
                      }),
                    }
                  }
                  nextSession={campaign.nextSession}
                  href={campaignHref(space.id, campaign.id)}
                  linkAs={Link}
                  onClick={closeDrawer}
                />
              ))}
        </ChannelCategory>
      </div>
      <UserPanel />
    </div>
  );
}
