"use client";

import type { CampaignMember, Channel, Character, Profile, Reaction, Sticker } from "@fellowship/db";
import type { PresenceStatus } from "@fellowship/ui";
import { useMemo } from "react";
import { VoiceRoom } from "@/components/account/VoiceRoom";
import channelStyles from "@/components/channel/Channel.module.sass";
import { ChatRoom } from "@/components/chat/room/ChatRoom";
import { MembersList, type MemberEntry } from "@/components/shell/MembersList";
import { ContentHeader, MembersToggle } from "@/components/shell/ContentHeader";
import { channelIcon } from "@/lib/app/channels";
import type { ChatAuthor, ChatMsg } from "@/lib/chat/source";
import { usePresenceMap } from "@/lib/presence/PresenceProvider";

type P = Pick<Profile, "id" | "display_name" | "username" | "avatar_url" | "color" | "bio"> & { banner_url?: string | null };

/** Canal da campanha: chat com rolador (rolar como personagem) ou sala de voz, e quem joga ao lado. */
export function CampaignChannelView(props: {
  spaceId: string;
  channel: Channel;
  me: P;
  profiles: Record<string, P>;
  members: CampaignMember[];
  characters: Character[];
  initialMessages: ChatMsg[];
  initialReactions: Reaction[];
  stickers: Sticker[];
  canSend: boolean;
  canManage: boolean;
  rollAs: Array<{ id: string; name: string }>;
  /** Nome na barra da campanha (Ingame, Outgame). */
  title: string;
  campaignName: string;
}) {
  const { channel, me, profiles, members, characters } = props;
  const presence = usePresenceMap();
  const authors = useMemo(() => profiles as Record<string, ChatAuthor>, [profiles]);
  // Na voz da mesa, cada jogador aparece como o (primeiro) personagem dele.
  const voiceCharacters = useMemo(() => {
    const map: Record<string, { name: string; portrait_url: string | null; color: string }> = {};
    for (const c of characters) if (c.kind === "pc" && c.owner_id && !map[c.owner_id]) map[c.owner_id] = { name: c.name, portrait_url: c.portrait_url, color: c.color };
    return map;
  }, [characters]);
  const groups = useMemo(() => {
    const entry = (m: CampaignMember): MemberEntry => {
      const p = profiles[m.user_id];
      const mine = characters.filter((c) => c.owner_id === m.user_id && c.kind === "pc").map((c) => c.name);
      const status: PresenceStatus = presence[m.user_id] ?? "offline";
      return { id: m.user_id, name: p?.display_name ?? "Alguém", color: p?.color ?? "#9b9ba5", avatarUrl: p?.avatar_url ?? undefined, profile: p, status, sub: mine.join(", ") || undefined };
    };
    return [
      { title: "Mestre", members: members.filter((m) => m.role === "mestre").map(entry) },
      { title: "Jogadores", members: members.filter((m) => m.role === "jogador").map(entry) },
      { title: "Assistindo", members: members.filter((m) => m.role === "espectador").map(entry) },
    ];
  }, [members, profiles, characters, presence]);

  return (
    <>
    <ContentHeader icon={channelIcon(channel)} title={props.title} topic={`${props.campaignName} · ${channel.topic ?? channel.name}`} actions={<MembersToggle />} />
    <div className={channelStyles.body}>
      <main className={channelStyles.main}>
        {channel.kind === "voz" || channel.kind === "voz_dinamica" ? (
          <VoiceRoom channel={channel} profiles={authors} characters={voiceCharacters} />
        ) : (
          <ChatRoom
            key={channel.id}
            source={{ type: "channel", id: channel.id, spaceId: props.spaceId, name: props.title, topic: channel.topic }}
            me={me}
            authors={authors}
            initialMessages={props.initialMessages}
            initialReactions={props.initialReactions}
            stickers={props.stickers}
            canSend={props.canSend}
            canManage={props.canManage}
            readOnlyReason="Quem está assistindo não escreve na mesa."
            intro={{ title: props.title, text: channel.topic ?? "O começo da mesa." }}
            rollAs={props.rollAs}
          />
        )}
      </main>
      <MembersList groups={groups} label="Quem joga" />
    </div>
    </>
  );
}
