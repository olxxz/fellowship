import { Permission } from "@fellowship/core";
import { notFound } from "next/navigation";
import { CampaignChannelView } from "@/components/campaign/CampaignChannelView";
import { loadCampaign } from "@/lib/app/campaign-context";
import { getChannelMessages, getChannelPermissions, getReactions, getStickers } from "@/lib/app/queries";

type Params = Promise<{ space: string; campaign: string; channel: string }>;

export default async function CampaignChannelPage({ params }: { params: Params }) {
  const { space, campaign, channel: channelId } = await params;
  const c = await loadCampaign(space, campaign, `/c/${space}/k/${campaign}/${channelId}`);
  const channel = c.channels.find((ch) => ch.id === channelId);
  if (!channel) notFound();
  // Os dois canais de texto da campanha aparecem como Ingame e Outgame na barra.
  const texts = c.channels.filter((ch) => ch.kind === "texto");
  const title = channel.id === texts[0]?.id ? "Ingame" : channel.id === texts[1]?.id ? "Outgame" : channel.name;
  const chat = channel.kind === "texto" || channel.kind === "anuncios";
  const [messages, perms, stickers] = await Promise.all([
    chat ? getChannelMessages(c.supabase, channelId) : [],
    getChannelPermissions(c.supabase, channelId),
    chat ? getStickers(c.supabase, space) : [],
  ]);
  const reactions = await getReactions(c.supabase, "message_reactions", messages.map((m) => m.id));
  // Rolar como: o mestre rola por qualquer personagem; o jogador, pelos dele.
  const rollAs = c.characters.filter((ch) => c.isMaster || ch.owner_id === c.profile.id).map((ch) => ({ id: ch.id, name: ch.name }));
  return (
    <CampaignChannelView
      spaceId={space}
      channel={channel}
      me={c.profile}
      profiles={c.profiles}
      members={c.members}
      characters={c.characters}
      initialMessages={messages}
      initialReactions={reactions}
      stickers={stickers}
      canSend={(perms & Permission.SEND_MESSAGES) !== 0}
      canManage={(perms & Permission.MANAGE_MESSAGES) !== 0}
      rollAs={rollAs}
      title={title}
      campaignName={c.campaign.name}
    />
  );
}
