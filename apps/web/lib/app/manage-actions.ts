"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/app/queries";

// Gerenciar o Cenário: todas as regras (permissão, hierarquia de cargos) ficam nas funções do banco.

type Result = { error?: string };

function message(error: { code?: string; message: string } | null, fallback: string) {
  if (error && ["22023", "28000", "42501"].includes(error.code ?? "")) return error.message;
  if (error) console.error(fallback, error);
  return fallback;
}

async function call(spaceId: string, fn: string, args: Record<string, unknown>, fallback: string): Promise<Result> {
  const { supabase } = await requireAccount();
  const { error } = await supabase.rpc(fn, args);
  revalidatePath(`/c/${spaceId}`, "layout");
  return error ? { error: message(error, fallback) } : {};
}

// ── Canais e categorias ──
export const updateChannelAction = async (spaceId: string, channelId: string, name: string, topic: string, categoryId: string | null) =>
  call(spaceId, "update_channel", { p_channel: channelId, p_name: name, p_topic: topic, p_category: categoryId }, "Não foi possível salvar o canal.");
export const deleteChannelAction = async (spaceId: string, channelId: string) =>
  call(spaceId, "delete_channel", { p_channel: channelId }, "Não foi possível apagar o canal.");
export const updateCategoryAction = async (spaceId: string, categoryId: string, name: string) =>
  call(spaceId, "update_category", { p_category: categoryId, p_name: name }, "Não foi possível renomear a categoria.");
export const deleteCategoryAction = async (spaceId: string, categoryId: string) =>
  call(spaceId, "delete_category", { p_category: categoryId }, "Não foi possível apagar a categoria.");
export const createCategoryAction = async (spaceId: string, name: string) =>
  call(spaceId, "create_category", { p_space: spaceId, p_name: name }, "Não foi possível criar a categoria.");
export const reorderChannelsAction = async (spaceId: string, categoryId: string | null, ids: string[]) =>
  call(spaceId, "reorder_channels", { p_space: spaceId, p_category: categoryId, p_ids: ids }, "Não foi possível mudar a ordem.");
export const reorderCategoriesAction = async (spaceId: string, ids: string[]) =>
  call(spaceId, "reorder_categories", { p_space: spaceId, p_ids: ids }, "Não foi possível mudar a ordem.");
export const setChannelOverrideAction = async (spaceId: string, channelId: string, roleId: string, allow: number, deny: number) =>
  call(spaceId, "set_channel_override", { p_channel: channelId, p_role: roleId, p_allow: allow, p_deny: deny }, "Não foi possível salvar a permissão.");

export async function getChannelOverridesAction(channelId: string) {
  const { supabase } = await requireAccount();
  const { data } = await supabase.rpc("channel_overrides", { p_channel: channelId });
  return (data ?? []) as { role_id: string; allow: number; deny: number }[];
}

// ── Cargos ──
export const createRoleAction = async (spaceId: string, name: string, color: number | null, permissions: number) =>
  call(spaceId, "create_role", { p_space: spaceId, p_name: name, p_color: color, p_permissions: permissions }, "Não foi possível criar o cargo.");
export const updateRoleAction = async (spaceId: string, roleId: string, name: string, color: number | null, permissions: number, grantedOnJoin: boolean) =>
  call(spaceId, "update_role", { p_role: roleId, p_name: name, p_color: color, p_permissions: permissions, p_granted_on_join: grantedOnJoin }, "Não foi possível salvar o cargo.");
export const deleteRoleAction = async (spaceId: string, roleId: string) => call(spaceId, "delete_role", { p_role: roleId }, "Não foi possível apagar o cargo.");
export const reorderRolesAction = async (spaceId: string, ids: string[]) =>
  call(spaceId, "reorder_roles", { p_space: spaceId, p_ids: ids }, "Não foi possível mudar a ordem.");

// ── Membros ──
export const setMemberRolesAction = async (spaceId: string, userId: string, roleIds: string[]) =>
  call(spaceId, "set_member_roles", { p_space: spaceId, p_user: userId, p_role_ids: roleIds }, "Não foi possível mudar os cargos.");
export const kickMemberAction = async (spaceId: string, userId: string) =>
  call(spaceId, "kick_member", { p_space: spaceId, p_user: userId }, "Não foi possível expulsar.");

export async function leaveSpaceAction(spaceId: string): Promise<Result> {
  const { supabase } = await requireAccount();
  const { error } = await supabase.rpc("leave_space", { p_space: spaceId });
  if (error) return { error: message(error, "Não foi possível sair do Cenário.") };
  revalidatePath("/", "layout");
  redirect("/inicio");
}

export async function deleteSpaceAction(spaceId: string, confirmName: string): Promise<Result> {
  const { supabase } = await requireAccount();
  const { data: space } = await supabase.from("spaces").select("name").eq("id", spaceId).maybeSingle<{ name: string }>();
  if (!space || space.name !== confirmName.trim()) return { error: "Digite o nome do Cenário exatamente como está." };
  const { data, error } = await supabase.from("spaces").delete().eq("id", spaceId).select("id");
  if (error || !data?.length) return { error: "Só o dono apaga o Cenário." };
  revalidatePath("/", "layout");
  redirect("/inicio");
}
