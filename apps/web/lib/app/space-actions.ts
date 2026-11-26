"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/app/queries";
import { appSpaceHref } from "@/lib/routes";

const HEX = /^#[0-9a-f]{6}$/;

/** Erros do banco que já vêm em português (raise exception com errcode de validação ou permissão). */
function dbMessage(error: { code?: string; message: string } | null, fallback: string) {
  if (error && ["22023", "28000", "42501"].includes(error.code ?? "")) return error.message;
  if (error) console.error(fallback, error);
  return fallback;
}

// ───────── Convites ─────────

export async function createInviteAction(spaceId: string, expiresHours: number | null, maxUses: number | null) {
  const { supabase } = await requireAccount();
  const { data, error } = await supabase.rpc("create_invite", { p_space: spaceId, p_expires_hours: expiresHours, p_max_uses: maxUses });
  if (error || typeof data !== "string") return { error: dbMessage(error, "Não foi possível criar o convite agora.") };
  revalidatePath(`/c/${spaceId}/configuracoes`);
  return { code: data };
}

export async function revokeInviteAction(spaceId: string, code: string) {
  const { supabase } = await requireAccount();
  const { error } = await supabase.rpc("revoke_invite", { p_code: code });
  revalidatePath(`/c/${spaceId}/configuracoes`);
  return error ? { error: dbMessage(error, "Não foi possível revogar o convite.") } : {};
}

export interface AcceptState {
  error?: string;
}

export async function acceptInviteAction(_prev: AcceptState, form: FormData): Promise<AcceptState> {
  const code = String(form.get("code") ?? "");
  const { supabase } = await requireAccount(`/convite/${code}`);
  const { data: spaceId, error } = await supabase.rpc("accept_invite", { p_code: code });
  if (error || typeof spaceId !== "string") return { error: dbMessage(error, "Não foi possível aceitar o convite agora.") };
  revalidatePath("/", "layout");
  redirect(appSpaceHref(spaceId));
}

// ───────── Cenário ─────────

export interface FormState {
  error?: string;
  saved?: boolean;
}

export async function updateSpaceAction(spaceId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAccount();
  const name = String(form.get("name") ?? "").trim();
  const short = String(form.get("short") ?? "").trim().toUpperCase();
  const description = String(form.get("description") ?? "").trim();
  const color = String(form.get("color") ?? "").trim().toLowerCase();
  if (name.length < 2 || name.length > 60) return { error: "O nome precisa ter entre 2 e 60 caracteres." };
  if (short.length < 1 || short.length > 3) return { error: "As iniciais do ícone têm de 1 a 3 caracteres." };
  if (description.length > 300) return { error: "A descrição vai até 300 caracteres." };
  if (!HEX.test(color)) return { error: "Escolha uma cor válida." };

  const { data, error } = await supabase
    .from("spaces")
    .update({ name, short, description: description || null, color })
    .eq("id", spaceId)
    .select("id");
  if (error) return { error: dbMessage(error, "Não foi possível salvar agora.") };
  if (!data?.length) return { error: "Você não tem permissão para editar este Cenário." };
  revalidatePath(`/c/${spaceId}`, "layout");
  revalidatePath("/inicio");
  return { saved: true };
}

// ───────── Perfil ─────────

export async function updateProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await requireAccount("/conta");
  const display_name = String(form.get("display_name") ?? "").trim();
  const bio = String(form.get("bio") ?? "").trim();
  const color = String(form.get("color") ?? "").trim().toLowerCase();
  if (display_name.length < 1 || display_name.length > 60) return { error: "O nome precisa ter de 1 a 60 caracteres." };
  if (bio.length > 300) return { error: "A bio vai até 300 caracteres." };
  if (!HEX.test(color)) return { error: "Escolha uma cor válida." };

  const { error } = await supabase.from("profiles").update({ display_name, bio: bio || null, color }).eq("id", user.id);
  if (error) return { error: dbMessage(error, "Não foi possível salvar agora.") };
  revalidatePath("/", "layout");
  return { saved: true };
}
