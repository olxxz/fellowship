"use client";

import { cx, Icon, IconButton, playerColorStyle } from "@fellowship/ui";
import type { Campaign, CampaignRole, Channel } from "@fellowship/db";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShell } from "@/components/shell/ShellContext";
import { channelIcon } from "@/lib/app/channels";
import { campaignAppHref } from "@/lib/routes";
import styles from "./Campaign.module.sass";

const ROLE: Record<CampaignRole, string> = { mestre: "Mestre", jogador: "Jogador", espectador: "Assistindo" };

/** Cabeçalho da campanha: nome, seu papel e as abas (canais, Personagens, Membros, Ajustes). */
export function CampaignNav({ spaceId, campaign, channels, isMaster, role }: { spaceId: string; campaign: Campaign; channels: Channel[]; isMaster: boolean; role: CampaignRole | null }) {
  const path = usePathname();
  const { openDrawer } = useShell();
  const tabs = [
    ...channels.map((c) => ({ href: campaignAppHref(spaceId, campaign.id, c.id), label: c.name, icon: channelIcon(c) })),
    { href: campaignAppHref(spaceId, campaign.id, "personagens"), label: "Personagens", icon: "sheet" as const },
    { href: campaignAppHref(spaceId, campaign.id, "membros"), label: "Membros", icon: "users" as const },
    ...(isMaster ? [{ href: campaignAppHref(spaceId, campaign.id, "ajustes"), label: "Ajustes", icon: "settings" as const }] : []),
  ];
  return (
    <header className={styles.head} style={playerColorStyle(campaign.color, campaign.banner_url ? { ["--banner-image" as string]: `url("${campaign.banner_url}")` } : undefined)}>
      <div className={styles.titleRow}>
        <IconButton className={styles.menu} variant="ghost" icon="menu" label="Abrir navegação" onClick={openDrawer} />
        <Icon name="dice" size={20} className={styles.dice} />
        <h1 className={styles.title}>{campaign.name}</h1>
        {role && <span className={styles.role}>{ROLE[role]}</span>}
      </div>
      {role && (
        <nav className={styles.tabs} aria-label="Seções da campanha">
          {tabs.map((t) => {
            const active = path === t.href || path.startsWith(`${t.href}/`);
            return (
              <Link key={t.href} href={t.href} className={cx(styles.tab, active && styles.tabActive)} aria-current={active ? "page" : undefined}>
                <Icon name={t.icon} size={16} />
                {t.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
