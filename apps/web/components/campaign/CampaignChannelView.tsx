"use client";

import type { CampaignMember, Channel, Character, Profile, Reaction, Sticker } from "@fellowship/db";
import type { PresenceStatus } from "@fellowship/ui";
import { useMemo } from "react";
import { VoiceRoom } from "@/components/account/VoiceRoom";
import channelStyles from "@/components/channel/Channel.module.sass";
import { ChatRoom } from "@/components/chat/room/ChatRoom";
import { MembersList, type MemberEntry } from "@/components/shell/MembersList";
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
}) {
  const { channel, me, profiles, members, characters } = props;
  const presence = usePresenceMap();
  const authors = useMemo(() => profiles as Record<string, ChatAuthor>, [profiles]);
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
    <div className={channelStyles.body}>
      <main className={channelStyles.main}>
        {channel.kind === "voz" || channel.kind === "voz_dinamica" ? (
          <VoiceRoom channel={channel} profiles={authors} />
        ) : (
          <ChatRoom
            key={channel.id}
            source={{ type: "channel", id: channel.id, spaceId: props.spaceId, name: channel.name, topic: channel.topic }}
            me={me}
            authors={authors}
            initialMessages={props.initialMessages}
            initialReactions={props.initialReactions}
            stickers={props.stickers}
            canSend={props.canSend}
            canManage={props.canManage}
            readOnlyReason="Quem está assistindo não escreve na mesa."
            intro={{ title: channel.name, text: channel.topic ?? "O começo da mesa." }}
            rollAs={props.rollAs}
          />
        )}
      </main>
      <MembersList groups={groups} label="Quem joga" />
    </div>
  );
}
