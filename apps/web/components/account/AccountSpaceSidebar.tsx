"use client";

import { ChannelCategory, ChannelRow, Icon, playerColorStyle } from "@fellowship/ui";
import { Permission } from "@fellowship/core";
import type { Category, Channel, Space } from "@fellowship/db";
import Link from "next/link";
import { PendingLink } from "@/components/nav/PendingLink";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useShell } from "@/components/shell/ShellContext";
import styles from "@/components/shell/Sidebar.module.sass";
import { channelIcon } from "@/lib/app/channels";
import { appSpaceHref, campaignHref } from "@/lib/routes";
import { CreateChannelDialog } from "./CreateChannelDialog";
import { InviteDialog } from "./InviteDialog";
import { SidebarChannels } from "./SidebarChannels";
import { SpaceMenu } from "./SpaceMenu";
import { useSpaceVoicePresence, VoicePeople } from "./VoicePeople";
import { useVoice } from "@/lib/livekit/VoiceProvider";
import { useChannelUnread } from "./useChannelUnread";

/** Barra do Cenário real: só os canais que a conta pode ver (o banco já filtra pelo RLS). */
export function AccountSpaceSidebar({
  space,
  categories,
  channels,
  permissions,
  meId,
  memberIds,
  initialUnread,
}: {
  space: Space;
  categories: Category[];
  channels: Channel[];
  permissions: number;
  meId: string;
  memberIds: string[];
  initialUnread: Record<string, { unread: number; mentions: number }>;
}) {
  const { channel: activeId } = useParams<{ channel?: string }>();
  const { closeDrawer } = useShell();
  const [inviting, setInviting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const canInvite = (permissions & Permission.CREATE_INVITES) !== 0;
  const canManageChannels = (permissions & Permission.MANAGE_CHANNELS) !== 0;
  const [creatingIn, setCreatingIn] = useState<{ open: boolean; categoryId: string | null }>({ open: false, categoryId: null });
  const addButton = (categoryId: string | null, label: string) => (
    <button type="button" className={styles.addChannel} aria-label={label} title={label} onClick={() => setCreatingIn({ open: true, categoryId })}>
      <Icon name="plus" size={16} />
    </button>
  );

  const voice = useVoice();
  const unread = useChannelUnread(space.id, meId, activeId, initialUnread);
  const presence = useSpaceVoicePresence(space.id, voice.enabled);

  const row = (c: Channel) => {
    const isVoice = c.kind === "voz" || c.kind === "voz_dinamica";
    const link = (
      <ChannelRow
        key={c.id}
        icon={channelIcon(c)}
        name={c.name}
        active={c.id === activeId}
        unread={!isVoice && c.id !== activeId && (unread[c.id]?.unread ?? 0) > 0}
        meta={!isVoice && c.id !== activeId && unread[c.id]?.mentions ? <span className={styles.mentionBadge}>{unread[c.id]!.mentions}</span> : undefined}
        href={appSpaceHref(space.id, c.id)}
        linkAs={PendingLink}
        onClick={(e) => {
          // Voz como no Discord: o primeiro clique entra na sala sem sair da página; com a sala já conectada, abre a sala.
          if (isVoice && voice.enabled && voice.current?.id !== c.id) {
            e.preventDefault();
            voice.requestJoin({ id: c.id, name: c.name, spaceId: space.id });
            return;
          }
          closeDrawer();
        }}
      />
    );
    if (!isVoice) return link;
    const people = voice.current?.id === c.id && voice.status === "on" ? voice.people : (presence[c.id] ?? []);
    return (
      <div key={c.id}>
        {link}
        <VoicePeople people={people} />
      </div>
    );
  };

  return (
    <div className={styles.sidebar}>
      {/* O banner abre o menu do Cenário (convidar, configurações, criar canal…). */}
      <button
        type="button"
        className={styles.banner}
        style={playerColorStyle(space.color, space.banner_url ? { ["--banner-image" as string]: `url("${space.banner_url}")` } : undefined)}
        data-image={space.banner_url ? "" : undefined}
        aria-expanded={menuOpen}
        aria-haspopup="dialog"
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span className={styles.bannerName}>
          {space.name}
          <Icon name="chevronDown" size={16} className={menuOpen ? styles.bannerChevronOpen : styles.bannerChevron} />
        </span>
        {space.description && <span className={styles.bannerSub}>{space.description}</span>}
      </button>
      <SpaceMenu
        space={space}
        permissions={permissions}
        isOwner={space.owner_id === meId}
        channelIds={channels.map((c) => c.id)}
        memberIds={memberIds}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onInvite={() => setInviting(true)}
        onCreateChannel={() => setCreatingIn({ open: true, categoryId: null })}
      />
      {canManageChannels && (
        <CreateChannelDialog
          spaceId={space.id}
          categories={categories}
          open={creatingIn.open}
          initialCategoryId={creatingIn.categoryId}
          onOpenChange={(open) => setCreatingIn((c) => ({ ...c, open }))}
        />
      )}
      {canInvite && <InviteDialog spaceId={space.id} spaceName={space.name} open={inviting} onOpenChange={setInviting} />}
      <div className={styles.scroll}>
        <SidebarChannels
          spaceId={space.id}
          categories={categories}
          channels={channels}
          canManage={canManageChannels}
          renderRow={row}
          categoryAction={(cat) => (canManageChannels ? addButton(cat.id, `Criar canal em ${cat.name}`) : undefined)}
        />
        {canManageChannels && (
          <button type="button" className={styles.addChannelRow} onClick={() => setCreatingIn({ open: true, categoryId: null })}>
            <Icon name="plus" size={18} />
            Criar canal
          </button>
        )}
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
    </div>
  );
}
