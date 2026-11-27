"use client";

import { ChannelCategory, ChannelRow, Icon, playerColorStyle } from "@fellowship/ui";
import type { VoicePerson } from "@/lib/livekit/VoiceProvider";
import { usePathname } from "next/navigation";
import { PendingLink } from "@/components/nav/PendingLink";
import { VoicePeople } from "@/components/account/VoicePeople";
import { useShell } from "@/components/shell/ShellContext";
import styles from "@/components/shell/Sidebar.module.sass";
import type { SpaceCampaign } from "@/lib/app/queries";
import { appSpaceHref, campaignAppHref } from "@/lib/routes";

/**
 * Barra da campanha (como no protótipo): entra no lugar da barra do Cenário, com botão de voltar.
 * Sessão: Mesa, Ingame e Outgame. Ferramentas: fichas, sessões, membros e ajustes.
 */
export function CampaignSidebar({ spaceId, spaceName, campaign, voicePeople }: { spaceId: string; spaceName: string; campaign: SpaceCampaign; voicePeople: VoicePerson[] }) {
  const path = usePathname();
  const { closeDrawer } = useShell();
  const texts = campaign.channels.filter((c) => c.kind === "texto");
  const [ingame, outgame] = texts;
  const master = campaign.myRole === "mestre";
  const base = campaignAppHref(spaceId, campaign.id);

  const row = (href: string, icon: Parameters<typeof ChannelRow>[0]["icon"], name: string, meta?: string) => (
    <ChannelRow key={href} icon={icon} name={name} href={href} linkAs={PendingLink} onClick={closeDrawer} active={path === href || (href !== base && path.startsWith(`${href}/`))} meta={meta} metaTone="mesa" />
  );

  return (
    <>
      <header className={styles.banner} style={playerColorStyle(campaign.color, campaign.banner_url ? { ["--banner-image" as string]: `url("${campaign.banner_url}")` } : undefined)} data-image={campaign.banner_url ? "" : undefined}>
        <PendingLink className={styles.back} href={appSpaceHref(spaceId)} onClick={closeDrawer}>
          <Icon name="back" size={16} />
          {spaceName}
        </PendingLink>
        <h2 className={styles.bannerName}>{campaign.name}</h2>
        {campaign.session ? (
          <p className={`${styles.bannerSub} ${styles.live}`}>
            <span className={styles.liveDot} aria-hidden="true" />
            Ao vivo · Sessão {campaign.session.number}
          </p>
        ) : (
          <p className={styles.bannerSub}>{master ? "Abra a sessão na Mesa quando o grupo chegar." : "Nenhuma sessão agora."}</p>
        )}
      </header>
      <div className={styles.scroll}>
        {campaign.myRole && (
          <ChannelCategory name="Sessão">
            <div>
              {row(base, "dice", "Mesa", voicePeople.length ? `${voicePeople.length} na voz` : undefined)}
              <VoicePeople people={voicePeople} />
            </div>
            {ingame && row(campaignAppHref(spaceId, campaign.id, ingame.id), "quote", "Ingame")}
            {outgame && row(campaignAppHref(spaceId, campaign.id, outgame.id), "chat", "Outgame")}
          </ChannelCategory>
        )}
        <ChannelCategory name="Ferramentas">
          {campaign.myRole && row(campaignAppHref(spaceId, campaign.id, "personagens"), "sheet", "Fichas")}
          {campaign.myRole && row(campaignAppHref(spaceId, campaign.id, "sessoes"), "book", "Sessões")}
          {row(campaignAppHref(spaceId, campaign.id, "membros"), "users", "Membros")}
          {master && row(campaignAppHref(spaceId, campaign.id, "ajustes"), "settings", "Ajustes")}
        </ChannelCategory>
      </div>
    </>
  );
}
