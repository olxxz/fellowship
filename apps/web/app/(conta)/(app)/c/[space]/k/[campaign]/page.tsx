import { Permission } from "@fellowship/core";
import type { Metadata } from "next";
import { MesaRoom } from "@/components/campaign/mesa/MesaRoom";
import { loadCampaign } from "@/lib/app/campaign-context";
import { getChannelMessages, getChannelPermissions, getReactions, getStickers } from "@/lib/app/queries";

type Params = Promise<{ space: string; campaign: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { space, campaign } = await params;
  const c = await loadCampaign(space, campaign, `/c/${space}/k/${campaign}`);
  return { title: `Mesa · ${c.campaign.name}` };
}

/** A Mesa: o palco da campanha (voz com os personagens, cena, dados, ficha) com o chat Ingame/Outgame ao lado. */
export default async function MesaPage({ params }: { params: Params }) {
  const { space, campaign } = await params;
  const c = await loadCampaign(space, campaign, `/c/${space}/k/${campaign}`);
  const texts = c.channels.filter((ch) => ch.kind === "texto");
  const voiceChannel = c.channels.find((ch) => ch.kind === "voz") ?? null;
  const chat = async (channel: (typeof texts)[number] | undefined) => {
    if (!channel) return null;
    const [messages, perms] = await Promise.all([getChannelMessages(c.supabase, channel.id), getChannelPermissions(c.supabase, channel.id)]);
    const reactions = await getReactions(c.supabase, "message_reactions", messages.map((m) => m.id));
    return { channel, messages, reactions, canSend: (perms & Permission.SEND_MESSAGES) !== 0, canManage: (perms & Permission.MANAGE_MESSAGES) !== 0 };
  };
  const [ingame, outgame, stickers] = await Promise.all([chat(texts[0]), chat(texts[1]), getStickers(c.supabase, space)]);
  const rollAs = c.characters.filter((ch) => c.isMaster || ch.owner_id === c.profile.id).map((ch) => ({ id: ch.id, name: ch.name }));
  return (
    <MesaRoom
      spaceId={space}
      campaign={c.campaign}
      session={c.session}
      me={c.profile}
      isMaster={c.isMaster}
      canPlay={c.myRole === "mestre" || c.myRole === "jogador"}
      members={c.members}
      profiles={c.profiles}
      characters={c.characters}
      ingame={ingame}
      outgame={outgame}
      voiceChannel={voiceChannel}
      stickers={stickers}
      rollAs={rollAs}
      model={c.model}
    />
  );
}
