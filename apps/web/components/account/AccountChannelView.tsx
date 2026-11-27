"use client";

import type { Channel, Profile, Reaction, Role, Space, Sticker } from "@fellowship/db";
import { useMemo } from "react";
import styles from "@/components/channel/Channel.module.sass";
import { EmptyState } from "@/components/common/EmptyState";
import { ContentHeader, MembersToggle } from "@/components/shell/ContentHeader";
import { MembersList, type MemberEntry } from "@/components/shell/MembersList";
import { channelIcon, isChatChannel } from "@/lib/app/channels";
import type { SpaceMemberView } from "@/lib/app/queries";
import { ChatRoom } from "@/components/chat/room/ChatRoom";
import { GalleryView } from "@/components/gallery/GalleryView";
import { usePresenceMap } from "@/lib/presence/PresenceProvider";
import type { PresenceStatus } from "@fellowship/ui";
import type { ChatAuthor, ChatMsg } from "@/lib/chat/source";
import { VoiceRoom } from "./VoiceRoom";

const PLACEHOLDER = {
  funcional: { title: "Ferramenta em construção", text: "Este canal vai virar uma ferramenta: regras da casa, agenda de sessões, enquete de data." },
} as const;

/** Agrupa os membros pelo cargo mais alto, com o Dono primeiro. */
function memberGroups(space: Space, roles: Role[], members: SpaceMemberView[], presence: Record<string, PresenceStatus>) {
  const ordered = [...roles].filter((r) => !r.is_default).sort((a, b) => b.position - a.position);
  const fallback = roles.find((r) => r.is_default)?.name ?? "Membros";
  const groups = new Map<string, MemberEntry[]>([["Dono", []], ...ordered.map((r) => [r.name, []] as [string, MemberEntry[]]), [fallback, []]]);
  for (const m of members) {
    const status = presence[m.user_id] ?? "offline";
    const entry: MemberEntry = { id: m.user_id, name: m.profile.display_name, color: m.profile.color, avatarUrl: m.profile.avatar_url ?? undefined, profile: m.profile, status, sub: status === "em-sessao" ? "Em voz" : undefined };
    const top = ordered.find((r) => m.roleIds.includes(r.id));
    const group = m.user_id === space.owner_id ? "Dono" : (top?.name ?? fallback);
    groups.get(group)!.push(entry);
  }
  // Online primeiro, depois ausente, offline por último (esmaecido).
  const rank: Record<PresenceStatus, number> = { "em-sessao": 0, online: 0, ausente: 1, offline: 2 };
  return [...groups.entries()].map(([title, list]) => ({
    title,
    members: list.sort((a, b) => rank[a.status ?? "offline"] - rank[b.status ?? "offline"] || a.name.localeCompare(b.name, "pt-BR")),
  }));
}

export interface AccountChannelViewProps {
  space: Space;
  channel: Channel;
  roles: Role[];
  members: SpaceMemberView[];
  initialMessages: ChatMsg[];
  initialReactions: Reaction[];
  gallery: { posts: ChatMsg[]; counts: Record<string, number> } | null;
  stickers: Sticker[];
  canManage: boolean;
  me: Pick<Profile, "id" | "display_name" | "username" | "avatar_url" | "color">;
  canSend: boolean;
  readOnlyReason: string;
}

export function AccountChannelView({ space, channel, roles, members, initialMessages, initialReactions, gallery, stickers, canManage, me, canSend, readOnlyReason }: AccountChannelViewProps) {
  const authors = useMemo(() => Object.fromEntries(members.map((m) => [m.user_id, m.profile])) as Record<string, ChatAuthor>, [members]);
  const presence = usePresenceMap();
  const groups = useMemo(() => memberGroups(space, roles, members, presence), [space, roles, members, presence]);

  return (
    <>
      <ContentHeader icon={channelIcon(channel)} title={channel.name} topic={channel.topic ?? undefined} actions={<MembersToggle />} />
      <div className={styles.body}>
        <main className={styles.main}>
          {isChatChannel(channel.kind) ? (
            <ChatRoom
              key={channel.id}
              source={{ type: "channel", id: channel.id, spaceId: space.id, name: channel.name, topic: channel.topic }}
              me={me}
              authors={authors}
              initialMessages={initialMessages}
              initialReactions={initialReactions}
              stickers={stickers}
              canSend={canSend}
              canManage={canManage}
              readOnlyReason={readOnlyReason}
              intro={{ title: channel.name, text: channel.topic ?? `O começo do canal ${channel.name}.` }}
            />
          ) : channel.kind === "galeria" && gallery ? (
            <GalleryView
              key={channel.id}
              channelId={channel.id}
              spaceId={space.id}
              channelName={channel.name}
              me={me}
              authors={authors}
              initialPosts={gallery.posts}
              initialCommentCounts={gallery.counts}
              canPost={canSend}
              canManage={canManage}
            />
          ) : channel.kind === "voz" || channel.kind === "voz_dinamica" ? (
            <VoiceRoom channel={channel} profiles={authors} />
          ) : (
            <EmptyState icon={channelIcon(channel)} title={PLACEHOLDER[channel.kind as keyof typeof PLACEHOLDER].title}>
              {PLACEHOLDER[channel.kind as keyof typeof PLACEHOLDER].text}
            </EmptyState>
          )}
        </main>
        <MembersList label={`Membros de ${space.name}`} groups={groups} />
      </div>
    </>
  );
}
