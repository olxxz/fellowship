import { icons, type IconName } from "@fellowship/ui";
import type { Channel, ChannelKind } from "@fellowship/db";

const BY_KIND: Record<ChannelKind, IconName> = {
  texto: "chat",
  anuncios: "announcement",
  galeria: "gallery",
  voz: "mic",
  voz_dinamica: "mic",
  funcional: "rules",
};

/** Ícone do canal: o nome semântico salvo no banco, ou o padrão do tipo. Nunca "#". */
export function channelIcon(channel: Pick<Channel, "icon" | "kind">): IconName {
  // Canais de voz sempre com o microfone (os criados antes guardaram "voice").
  if (channel.kind === "voz" || channel.kind === "voz_dinamica") return "mic";
  return channel.icon && channel.icon in icons ? (channel.icon as IconName) : BY_KIND[channel.kind];
}

export const isChatChannel = (kind: ChannelKind) => kind === "texto" || kind === "anuncios";
