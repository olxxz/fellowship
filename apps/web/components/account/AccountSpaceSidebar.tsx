"use client";

import { Button, ChannelCategory, ChannelRow, Icon, IconButton, playerColorStyle } from "@fellowship/ui";
import { Permission } from "@fellowship/core";
import type { Category, Channel, Space } from "@fellowship/db";
import Link from "next/link";
import { PendingLink } from "@/components/nav/PendingLink";
import { useParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useShell } from "@/components/shell/ShellContext";
import styles from "@/components/shell/Sidebar.module.sass";
import { channelIcon } from "@/lib/app/channels";
import { appSpaceHref, campaignHref } from "@/lib/routes";
import { AccountPanel, type AccountProfile } from "./AccountPanel";
import { CreateChannelDialog } from "./CreateChannelDialog";
import { InviteDialog } from "./InviteDialog";
import { useSpaceVoicePresence, VoicePeople } from "./VoicePeople";
import { useVoice } from "@/lib/livekit/VoiceProvider";

/** Barra do Cenário real: só os canais que a conta pode ver (o banco já filtra pelo RLS). */
export function AccountSpaceSidebar({
  space,
  categories,
  channels,
  profile,
  permissions,
}: {
  space: Space;
  categories: Category[];
  channels: Channel[];
  profile: AccountProfile;
  permissions: number;
}) {
  const { channel: activeId } = useParams<{ channel?: string }>();
  const { closeDrawer } = useShell();
  const router = useRouter();
  const [inviting, setInviting] = useState(false);
  const [openingSettings, startSettings] = useTransition();
  const canInvite = (permissions & Permission.CREATE_INVITES) !== 0;
  const canManage = (permissions & Permission.MANAGE_THEME) !== 0;
  const canManageChannels = (permissions & Permission.MANAGE_CHANNELS) !== 0;
  const [creatingIn, setCreatingIn] = useState<{ open: boolean; categoryId: string | null }>({ open: false, categoryId: null });
  const addButton = (categoryId: string | null, label: string) => (
    <button type="button" className={styles.addChannel} aria-label={label} title={label} onClick={() => setCreatingIn({ open: true, categoryId })}>
      <Icon name="plus" size={16} />
    </button>
  );

  const voice = useVoice();
  const presence = useSpaceVoicePresence(space.id, voice.enabled);

  const row = (c: Channel) => {
    const isVoice = c.kind === "voz" || c.kind === "voz_dinamica";
    const link = (
      <ChannelRow
        key={c.id}
        icon={channelIcon(c)}
        name={c.name}
        active={c.id === activeId}
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
  const loose = channels.filter((c) => !c.category_id);
  const groups = categories.map((cat) => ({ cat, items: channels.filter((c) => c.category_id === cat.id) })).filter((g) => g.items.length > 0 || canManageChannels);

  return (
    <div className={styles.sidebar}>
      <header className={`${styles.banner} ${canManage ? styles.bannerWithAction : ""}`} style={playerColorStyle(space.color)}>
        {canManage && (
          <IconButton
            className={styles.bannerAction}
            icon="settings"
            label="Configurações do Cenário"
            loading={openingSettings}
            onClick={() => {
              closeDrawer();
              startSettings(() => router.push(`/c/${space.id}/configuracoes`));
            }}
          />
        )}
        <h2 className={styles.bannerName}>{space.name}</h2>
        {space.description && <p className={styles.bannerSub}>{space.description}</p>}
        {canInvite && (
          <Button className={styles.invite} icon="userPlus" onClick={() => setInviting(true)}>
            Convidar
          </Button>
        )}
      </header>
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
        {loose.length > 0 && <div>{loose.map(row)}</div>}
        {groups.map(({ cat, items }) => (
          <ChannelCategory key={cat.id} name={cat.name} action={canManageChannels ? addButton(cat.id, `Criar canal em ${cat.name}`) : undefined}>
            {items.map(row)}
          </ChannelCategory>
        ))}
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
      <AccountPanel profile={profile} />
    </div>
  );
}
