import { Permission } from "@fellowship/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountChannelView } from "@/components/account/AccountChannelView";
import { isChatChannel } from "@/lib/app/channels";
import { getChannelMessages, getChannelPermissions, getGallery, getReactions, getSpaceView, getStickers, requireAccount } from "@/lib/app/queries";

type Params = Promise<{ space: string; channel: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { space, channel } = await params;
  const { supabase } = await requireAccount();
  const view = await getSpaceView(supabase, space);
  const c = view.channels.find((x) => x.id === channel);
  return { title: c ? `${c.name} · ${view.space.name}` : view.space.name };
}

export default async function ChannelPage({ params }: { params: Params }) {
  const { space: spaceId, channel: channelId } = await params;
  const { supabase, profile } = await requireAccount(`/c/${spaceId}/${channelId}`);
  const view = await getSpaceView(supabase, spaceId);
  const channel = view.channels.find((c) => c.id === channelId);
  if (!channel) notFound();

  const chat = isChatChannel(channel.kind);
  const [messages, perms, stickers] = await Promise.all([
    chat ? getChannelMessages(supabase, channelId) : [],
    getChannelPermissions(supabase, channelId),
    chat ? getStickers(supabase, spaceId) : [],
  ]);
  const [reactions, gallery] = await Promise.all([
    getReactions(supabase, "message_reactions", messages.map((m) => m.id)),
    channel.kind === "galeria" ? getGallery(supabase, channelId) : null,
  ]);
  const canSend = (perms & Permission.SEND_MESSAGES) !== 0 && (channel.kind !== "anuncios" || (perms & Permission.PUBLISH_ANNOUNCEMENTS) !== 0);

  return (
    <AccountChannelView
      space={view.space}
      channel={channel}
      roles={view.roles}
      members={view.members}
      initialMessages={messages}
      initialReactions={reactions}
      gallery={gallery}
      stickers={stickers}
      canManage={(perms & Permission.MANAGE_MESSAGES) !== 0}
      me={profile}
      canSend={canSend}
      readOnlyReason={channel.kind === "anuncios" ? "Só quem pode publicar anúncios escreve aqui." : "Seu cargo ainda não pode escrever neste canal."}
    />
  );
}
