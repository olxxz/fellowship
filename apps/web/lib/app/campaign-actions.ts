"use server";

import type { CampaignRole, CampaignSystem, SheetTemplate } from "@fellowship/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/app/queries";
import { campaignAppHref, characterHref } from "@/lib/routes";

type Result = { error?: string };

function message(error: { code?: string; message: string } | null, fallback: string) {
  if (error && ["22023", "28000", "42501"].includes(error.code ?? "")) return error.message;
  if (error) console.error(fallback, error);
  return fallback;
}

export async function createCampaignAction(input: { spaceId: string; name: string; description: string; color: string; system: CampaignSystem }): Promise<Result> {
  const { supabase } = await requireAccount();
  const { data, error } = await supabase.rpc("create_campaign", {
    p_space: input.spaceId,
    p_name: input.name,
    p_description: input.description,
    p_color: input.color,
    p_system: input.system,
  });
  if (error || typeof data !== "string") return { error: message(error, "Não foi possível criar a campanha.") };
  revalidatePath(`/c/${input.spaceId}`, "layout");
  redirect(campaignAppHref(input.spaceId, data));
}

export async function updateCampaignAction(
  spaceId: string,
  campaignId: string,
  input: { name: string; description: string; color: string; system: CampaignSystem; open: boolean; bannerUrl: string },
): Promise<Result> {
  const { supabase } = await requireAccount();
  const { error } = await supabase.rpc("update_campaign", {
    p_campaign: campaignId,
    p_name: input.name,
    p_description: input.description,
    p_color: input.color,
    p_system: input.system,
    p_open: input.open,
    p_banner_url: input.bannerUrl,
  });
  revalidatePath(`/c/${spaceId}`, "layout");
  return error ? { error: message(error, "Não foi possível salvar a campanha.") } : {};
}

export async function deleteCampaignAction(spaceId: string, campaignId: string): Promise<Result> {
  const { supabase } = await requireAccount();
  const { error } = await supabase.rpc("delete_campaign", { p_campaign: campaignId });
  if (error) return { error: message(error, "Não foi possível apagar a campanha.") };
  revalidatePath(`/c/${spaceId}`, "layout");
  redirect(`/c/${spaceId}`);
}

export async function setCampaignMemberAction(spaceId: string, campaignId: string, userId: string, role: CampaignRole | null): Promise<Result> {
  const { supabase } = await requireAccount();
  const { error } = await supabase.rpc("set_campaign_member", { p_campaign: campaignId, p_user: userId, p_role: role });
  revalidatePath(`/c/${spaceId}`, "layout");
  return error ? { error: message(error, "Não foi possível mudar o papel.") } : {};
}

export async function joinCampaignAction(spaceId: string, campaignId: string, role: "jogador" | "espectador"): Promise<Result> {
  const { supabase } = await requireAccount();
  const { error } = await supabase.rpc("join_campaign", { p_campaign: campaignId, p_role: role });
  revalidatePath(`/c/${spaceId}`, "layout");
  return error ? { error: message(error, "Não foi possível entrar.") } : {};
}

export async function leaveCampaignAction(spaceId: string, campaignId: string): Promise<Result> {
  const { supabase } = await requireAccount();
  const { error } = await supabase.rpc("leave_campaign", { p_campaign: campaignId });
  if (error) return { error: message(error, "Não foi possível sair.") };
  revalidatePath(`/c/${spaceId}`, "layout");
  redirect(`/c/${spaceId}`);
}

/** Cria personagem (jogador: o próprio; mestre: qualquer, inclusive NPC) e abre a ficha. */
export async function createCharacterAction(
  spaceId: string,
  campaignId: string,
  input: { name: string; template: SheetTemplate; kind: "pc" | "npc"; revealed: boolean; sheet: Record<string, unknown> },
): Promise<Result> {
  const { supabase, user } = await requireAccount();
  const { data, error } = await supabase
    .from("characters")
    .insert({
      campaign_id: campaignId,
      owner_id: input.kind === "pc" ? user.id : null,
      kind: input.kind,
      name: input.name.trim(),
      template: input.template,
      revealed: input.kind === "pc" ? true : input.revealed,
      sheet: input.sheet,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) return { error: error?.code === "42501" ? "Você não pode criar personagens nesta campanha." : "Não foi possível criar o personagem." };
  revalidatePath(campaignAppHref(spaceId, campaignId), "layout");
  redirect(characterHref(spaceId, campaignId, data.id));
}

export async function deleteCharacterAction(spaceId: string, campaignId: string, characterId: string): Promise<Result> {
  const { supabase } = await requireAccount();
  const { error } = await supabase.from("characters").delete().eq("id", characterId);
  if (error) return { error: "Não foi possível apagar o personagem." };
  revalidatePath(campaignAppHref(spaceId, campaignId), "layout");
  redirect(campaignAppHref(spaceId, campaignId, "personagens"));
}
