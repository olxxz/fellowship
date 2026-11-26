import "server-only";
import type { Category, Channel, Message, Profile, Role, Space } from "@fellowship/db";
import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getUser } from "@/lib/supabase/server";

// Todas as consultas passam pelo RLS: cada conta só recebe o que pode ver.

/** Conta logada com perfil, ou vai para /entrar. Uma consulta por requisição (cache). */
export const requireAccount = cache(async (next: string = "/inicio") => {
  const { supabase, user } = await getUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  const { data: profile } = await supabase.from("profiles").select("id, display_name, avatar_url, color, bio").eq("id", user.id).single<Profile>();
  if (!profile) redirect("/entrar?erro=perfil");
  return { supabase, user, profile };
});

export const getMySpaces = cache(async (supabase: SupabaseClient) => {
  const { data } = await supabase.from("spaces").select("id, kind, name, short, description, color, owner_id").order("created_at");
  return (data ?? []) as Space[];
});

export interface SpaceMemberView {
  user_id: string;
  profile: Pick<Profile, "id" | "display_name" | "avatar_url" | "color">;
  roleIds: string[];
}

export const getSpaceView = cache(async (supabase: SupabaseClient, spaceId: string) => {
  const [space, categories, channels, roles, members, memberRoles, perms] = await Promise.all([
    supabase.from("spaces").select("id, kind, name, short, description, color, owner_id").eq("id", spaceId).maybeSingle<Space>(),
    supabase.from("categories").select("id, space_id, name, position").eq("space_id", spaceId).order("position"),
    supabase.from("channels").select("id, space_id, category_id, kind, name, topic, icon, position").eq("space_id", spaceId).order("position"),
    supabase.from("roles").select("id, space_id, name, color, position, permissions, is_default").eq("space_id", spaceId).order("position", { ascending: false }),
    supabase.from("space_members").select("user_id, profile:profiles(id, display_name, avatar_url, color)").eq("space_id", spaceId),
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
  const { data } = await supabase
    .from("messages")
    .select("id, space_id, channel_id, author_id, scope, kind, content, created_at")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Message[]).reverse();
}

export async function getChannelPermissions(supabase: SupabaseClient, channelId: string) {
  const { data } = await supabase.rpc("channel_permissions", { p_channel: channelId });
  return (data as number | null) ?? 0;
}
