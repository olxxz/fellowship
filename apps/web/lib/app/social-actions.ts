"use server";

import type { FriendshipState, ProfileCard, PublicSpace } from "@fellowship/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/app/queries";
import { appSpaceHref } from "@/lib/routes";

function dbMessage(error: { code?: string; message: string } | null, fallback: string) {
  if (error && ["22023", "28000", "42501"].includes(error.code ?? "")) return error.message;
  if (error) console.error(fallback, error);
  return fallback;
}

function refresh() {
  revalidatePath("/amigos");
  revalidatePath("/inicio", "layout");
}

export async function findProfileAction(username: string): Promise<ProfileCard | null> {
  const { supabase } = await requireAccount();
  const { data } = await supabase.rpc("find_profile", { p_username: username });
  return (Array.isArray(data) ? data[0] : null) as ProfileCard | null;
}

export async function requestFriendAction(username: string): Promise<{ state?: FriendshipState; error?: string }> {
  const { supabase } = await requireAccount();
  const { data, error } = await supabase.rpc("request_friend", { p_username: username });
  if (error || typeof data !== "string") return { error: dbMessage(error, "Não foi possível enviar o pedido agora.") };
  refresh();
  return { state: data as FriendshipState };
}

export async function respondFriendAction(otherId: string, accept: boolean) {
  const { supabase } = await requireAccount();
  const { error } = await supabase.rpc("respond_friend", { p_other: otherId, p_accept: accept });
  refresh();
  return error ? { error: dbMessage(error, "Não foi possível responder agora.") } : {};
}

export async function removeFriendAction(otherId: string) {
  const { supabase } = await requireAccount();
  const { error } = await supabase.rpc("remove_friend", { p_other: otherId });
  refresh();
  return error ? { error: dbMessage(error, "Não foi possível desfazer agora.") } : {};
}

export async function listPublicSpacesAction(query: string): Promise<PublicSpace[]> {
  const { supabase } = await requireAccount();
  const { data } = await supabase.rpc("list_public_spaces", { p_query: query || null });
  return (data ?? []) as PublicSpace[];
}

export async function joinPublicSpaceAction(spaceId: string): Promise<{ error?: string }> {
  const { supabase } = await requireAccount();
  const { error } = await supabase.rpc("join_public_space", { p_space: spaceId });
  if (error) return { error: dbMessage(error, "Não foi possível entrar agora.") };
  revalidatePath("/", "layout");
  redirect(appSpaceHref(spaceId));
}
