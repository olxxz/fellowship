import "server-only";
import type { Campaign, CampaignMember, Category, Channel, Character, Profile, Reaction, Role, Space, Sticker } from "@fellowship/db";
import { CHANNEL_COLUMNS, DM_COLUMNS, toChatMsg, type ChatMsg } from "@/lib/chat/source";
import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { authEnabled } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";

// Todas as consultas passam pelo RLS: cada conta só recebe o que pode ver.

/** Conta logada com perfil, ou vai para /entrar. Uma consulta por requisição (cache). */
export const requireAccount = cache(async (next: string = "/inicio", { welcome = false }: { welcome?: boolean } = {}) => {
  // Sem Supabase configurado (ex.: CI), /entrar explica que o login não está disponível.
  if (!authEnabled) redirect("/entrar");
  const { supabase, user } = await getUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  const { data: profile } = await supabase.from("profiles").select("id, display_name, username, avatar_url, banner_url, color, bio, onboarded").eq("id", user.id).single<Profile>();
  if (!profile) redirect("/entrar?erro=perfil");
  // Conta nova: escolhe o nick (e confere nome, foto e cor) antes de usar o app.
  if (!welcome && !profile.onboarded) redirect(`/bem-vindo?next=${encodeURIComponent(next)}`);
  return { supabase, user, profile };
});

export const getMySpaces = cache(async (supabase: SupabaseClient) => {
  const { data } = await supabase.from("spaces").select("id, kind, name, short, description, color, owner_id, is_public, icon_url, banner_url").order("created_at");
  return (data ?? []) as Space[];
});

export interface SpaceMemberView {
  user_id: string;
  profile: Pick<Profile, "id" | "display_name" | "username" | "avatar_url" | "banner_url" | "color" | "bio">;
  roleIds: string[];
}

export const getSpaceView = cache(async (supabase: SupabaseClient, spaceId: string) => {
  const [space, categories, channels, roles, members, memberRoles, perms] = await Promise.all([
    supabase.from("spaces").select("id, kind, name, short, description, color, owner_id, is_public, icon_url, banner_url").eq("id", spaceId).maybeSingle<Space>(),
    supabase.from("categories").select("id, space_id, name, position").eq("space_id", spaceId).order("position"),
    supabase.from("channels").select("id, space_id, category_id, kind, name, topic, icon, position, campaign_id").eq("space_id", spaceId).is("campaign_id", null).order("position"),
    supabase.from("roles").select("id, space_id, name, color, position, permissions, is_default").eq("space_id", spaceId).order("position", { ascending: false }),
    supabase.from("space_members").select("user_id, profile:profiles(id, display_name, username, avatar_url, banner_url, color, bio)").eq("space_id", spaceId),
    supabase.from("member_roles").select("user_id, role_id").eq("space_id", spaceId),
    supabase.rpc("space_permissions", { p_space: spaceId }),
  ]);
  if (!space.data) notFound();
  const rolesByUser = new Map<string, string[]>();
  for (const mr of (memberRoles.data ?? []) as { user_id: string; role_id: string }[]) {
    rolesByUser.set(mr.user_id, [...(rolesByUser.get(mr.user_id) ?? []), mr.role_id]);
  }
  return {
    space: space.data,
    categories: (categories.data ?? []) as Category[],
    channels: (channels.data ?? []) as Channel[],
    roles: (roles.data ?? []) as Role[],
    members: ((members.data ?? []) as unknown as { user_id: string; profile: SpaceMemberView["profile"] }[]).map((m) => ({
      ...m,
      roleIds: rolesByUser.get(m.user_id) ?? [],
    })) as SpaceMemberView[],
    permissions: (perms.data as number | null) ?? 0,
  };
});

export async function getChannelMessages(supabase: SupabaseClient, channelId: string, limit = 60) {
  const { data } = await supabase.from("messages").select(CHANNEL_COLUMNS).eq("channel_id", channelId).order("created_at", { ascending: false }).limit(limit);
  return ((data ?? []) as unknown as ChatMsg[]).map(toChatMsg).reverse();
}

/** Reações das mensagens carregadas (canal ou conversa direta). */
export async function getReactions(supabase: SupabaseClient, table: "message_reactions" | "direct_reactions", ids: string[]) {
  if (!ids.length) return [];
  const { data } = await supabase.from(table).select("message_id, user_id, emoji").in("message_id", ids);
  return (data ?? []) as Reaction[];
}

/** Figurinhas: de um Cenário, ou de todos os Cenários da conta (nas conversas diretas). */
export async function getStickers(supabase: SupabaseClient, spaceId?: string) {
  let q = supabase.from("stickers").select("id, space_id, name, url").order("created_at");
  if (spaceId) q = q.eq("space_id", spaceId);
  const { data } = await q;
  return (data ?? []) as Sticker[];
}

export async function getChannelPermissions(supabase: SupabaseClient, channelId: string) {
  const { data } = await supabase.rpc("channel_permissions", { p_channel: channelId });
  return (data as number | null) ?? 0;
}

export type FriendProfile = Pick<Profile, "id" | "display_name" | "username" | "avatar_url" | "banner_url" | "color" | "bio">;

/** Amigos, pedidos recebidos e enviados da conta logada. */
export const getFriendsView = cache(async (supabase: SupabaseClient, meId: string) => {
  const { data: rows } = await supabase.from("friendships").select("user_a, user_b, requested_by, status");
  const list = (rows ?? []) as { user_a: string; user_b: string; requested_by: string; status: "pendente" | "aceita" }[];
  const otherOf = (r: (typeof list)[number]) => (r.user_a === meId ? r.user_b : r.user_a);
  const ids = list.map(otherOf);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, display_name, username, avatar_url, banner_url, color, bio, onboarded").in("id", ids)
    : { data: [] };
  const byId = new Map(((profiles ?? []) as FriendProfile[]).map((p) => [p.id, p]));
  const pick = (filter: (r: (typeof list)[number]) => boolean) =>
    list
      .filter(filter)
      .map((r) => byId.get(otherOf(r)))
      .filter((p): p is FriendProfile => !!p)
      .sort((a, b) => a.display_name.localeCompare(b.display_name, "pt-BR"));
  return {
    friends: pick((r) => r.status === "aceita"),
    incoming: pick((r) => r.status === "pendente" && r.requested_by !== meId),
    outgoing: pick((r) => r.status === "pendente" && r.requested_by === meId),
  };
});

/** Par ordenado de uma conversa direta (o banco guarda user_a < user_b). */
export const dmPair = (a: string, b: string) => (a < b ? [a, b] : [b, a]) as [string, string];

export async function getDirectMessages(supabase: SupabaseClient, me: string, other: string, limit = 60) {
  const [a, b] = dmPair(me, other);
  const { data } = await supabase
    .from("direct_messages")
    .select(DM_COLUMNS)
    .eq("user_a", a)
    .eq("user_b", b)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as ChatMsg[]).map(toChatMsg).reverse();
}

export const getSpaceUnread = cache(async (supabase: SupabaseClient) => {
  const { data } = await supabase.rpc("space_unread");
  return Object.fromEntries(((data ?? []) as { space_id: string; unread: number; mentions: number }[]).map((r) => [r.space_id, { unread: r.unread, mentions: r.mentions }]));
});

export async function getChannelUnread(supabase: SupabaseClient, spaceId: string) {
  const { data } = await supabase.rpc("channel_unread", { p_space: spaceId });
  return Object.fromEntries(((data ?? []) as { channel_id: string; unread: number; mentions: number }[]).map((r) => [r.channel_id, { unread: r.unread, mentions: r.mentions }]));
}

export async function getDirectUnread(supabase: SupabaseClient) {
  const { data } = await supabase.rpc("direct_unread");
  return Object.fromEntries(((data ?? []) as { other_id: string; unread: number }[]).map((r) => [r.other_id, r.unread]));
}

/** Galeria: as publicações mais novas (sem os comentários) e quantos comentários cada uma tem. */
export async function getGallery(supabase: SupabaseClient, channelId: string, limit = 30) {
  const { data } = await supabase
    .from("messages")
    .select(CHANNEL_COLUMNS)
    .eq("channel_id", channelId)
    .is("reply_to", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  const posts = ((data ?? []) as unknown as ChatMsg[]).map(toChatMsg);
  const counts: Record<string, number> = {};
  if (posts.length) {
    const { data: replies } = await supabase.from("messages").select("reply_to").in("reply_to", posts.map((p) => p.id));
    for (const r of (replies ?? []) as { reply_to: string }[]) counts[r.reply_to] = (counts[r.reply_to] ?? 0) + 1;
  }
  return { posts, counts };
}

export const CAMPAIGN_COLUMNS = "id, space_id, name, description, color, banner_url, system, open_to_join, position, created_by";
export const CHARACTER_COLUMNS = "id, campaign_id, owner_id, kind, name, portrait_url, color, template, sheet, revealed, updated_at";

/** Campanhas do Cenário e o papel da conta em cada uma (para a barra). */
export const getSpaceCampaigns = cache(async (supabase: SupabaseClient, spaceId: string, meId: string) => {
  const { data: campaigns } = await supabase.from("campaigns").select(CAMPAIGN_COLUMNS).eq("space_id", spaceId).order("position");
  const list = (campaigns ?? []) as Campaign[];
  const { data: mine } = list.length
    ? await supabase.from("campaign_members").select("campaign_id, user_id, role").eq("user_id", meId).in("campaign_id", list.map((c) => c.id))
    : { data: [] };
  const roles = Object.fromEntries(((mine ?? []) as CampaignMember[]).map((m) => [m.campaign_id, m.role]));
  return list.map((c) => ({ ...c, myRole: roles[c.id] ?? null }));
});

/** Tudo de uma campanha: dados, membros, canais (só aparecem para quem joga) e personagens visíveis. */
export const getCampaignView = cache(async (supabase: SupabaseClient, campaignId: string) => {
  const [campaign, members, channels, characters] = await Promise.all([
    supabase.from("campaigns").select(CAMPAIGN_COLUMNS).eq("id", campaignId).maybeSingle<Campaign>(),
    supabase.from("campaign_members").select("campaign_id, user_id, role").eq("campaign_id", campaignId),
    supabase.from("channels").select("id, space_id, category_id, kind, name, topic, icon, position, campaign_id").eq("campaign_id", campaignId).order("position"),
    supabase.from("characters").select(CHARACTER_COLUMNS).eq("campaign_id", campaignId).order("created_at"),
  ]);
  if (!campaign.data) notFound();
  return {
    campaign: campaign.data,
    members: (members.data ?? []) as CampaignMember[],
    channels: (channels.data ?? []) as Channel[],
    characters: (characters.data ?? []) as Character[],
  };
});
