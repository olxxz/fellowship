"use client";

import { ChannelCategory, ChannelRow, Icon, playerColorStyle } from "@fellowship/ui";
import Link from "next/link";
import { campaignChannelIds, campaignChannelInfo, type DemoCampaign, type DemoSpace } from "@/lib/demo/data";
import { campaignHref, spaceHref } from "@/lib/routes";
import { useShell } from "./ShellContext";
import styles from "./Sidebar.module.sass";
import { UserPanel } from "./UserPanel";

/** Barra da campanha: entra por cima da barra do Cenário, com botão de voltar. */
export function CampaignSidebar({ space, campaign, activeChannelId }: { space: DemoSpace; campaign: DemoCampaign; activeChannelId: string }) {
  const { closeDrawer } = useShell();

  const row = (id: (typeof campaignChannelIds)[number]) => {
    const info = campaignChannelInfo[id];
    return (
      <ChannelRow
        key={id}
        icon={info.icon}
        name={info.name}
        active={id === activeChannelId}
        // Sem contador nos sussurros: mostraria quantos sussurros os outros trocam com o mestre (metagame).
        meta={id === "mesa" && campaign.live ? `${campaign.characterIds.length + 1} na Mesa` : undefined}
        metaTone={id === "mesa" ? "mesa" : "faint"}
        href={campaignHref(space.id, campaign.id, id)}
        linkAs={Link}
        onClick={closeDrawer}
      />
    );
  };

  return (
    <div className={styles.sidebar}>
      <header className={styles.banner} style={playerColorStyle(campaign.color)}>
        <Link className={styles.back} href={spaceHref(space.id, "geral")} onClick={closeDrawer}>
          <Icon name="back" size={16} />
          {space.name}
        </Link>
        <h2 className={styles.bannerName}>{campaign.name}</h2>
        {campaign.live ? (
          <p className={`${styles.bannerSub} ${styles.live}`}>
            <span className={styles.liveDot} aria-hidden="true" />
            Ao vivo · Sessão {campaign.live.session}
          </p>
        ) : (
          <p className={styles.bannerSub}>Próxima sessão: {campaign.nextSession}</p>
        )}
      </header>
      <div className={styles.scroll}>
        <ChannelCategory name="Sessão">{(["mesa", "ingame", "outgame", "sussurros"] as const).map(row)}</ChannelCategory>
        <ChannelCategory name="Ferramentas">{(["fichas", "diario", "compendio", "mapa"] as const).map(row)}</ChannelCategory>
      </div>
      <UserPanel />
    </div>
  );
}
