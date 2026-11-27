"use server";

import type { Invite } from "@fellowship/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/app/queries";
import { appSpaceHref } from "@/lib/routes";

const HEX = /^#[0-9a-f]{6}$/;

/** Endereço de imagem aceito: vazio, o que já estava, ou um arquivo no bucket público dentro da pasta certa. */
function imageUrl(form: FormData, field: string, bucket: string, folder: string, current: string | null | undefined) {
  const value = String(form.get(field) ?? "").trim();
  if (!value) return null;
  if (value === current) return value;
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${folder}/`;
  return value.startsWith(base) ? value : undefined;
}

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

/** Convites ativos do Cenário que a conta pode ver (os próprios; quem gerencia canais vê todos). */
export async function listInvitesAction(spaceId: string) {
  const { supabase } = await requireAccount();
  const { data } = await supabase
    .from("invites")
    .select("code, space_id, created_by, max_uses, uses, expires_at, revoked_at, created_at")
    .eq("space_id", spaceId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  const now = Date.now();
  return ((data ?? []) as Invite[]).filter((i) => (!i.expires_at || new Date(i.expires_at).getTime() > now) && (i.max_uses === null || i.uses < i.max_uses));
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
  const is_public = form.get("is_public") === "on";
  const { data: current } = await supabase.from("spaces").select("icon_url, banner_url").eq("id", spaceId).maybeSingle<{ icon_url: string | null; banner_url: string | null }>();
  const icon_url = imageUrl(form, "icon_url", "cenarios", spaceId, current?.icon_url);
  const banner_url = imageUrl(form, "banner_url", "cenarios", spaceId, current?.banner_url);
  if (icon_url === undefined || banner_url === undefined) return { error: "Imagem inválida. Envie de novo." };
  if (name.length < 2 || name.length > 60) return { error: "O nome precisa ter entre 2 e 60 caracteres." };
  if (short.length < 1 || short.length > 3) return { error: "As iniciais do ícone têm de 1 a 3 caracteres." };
  if (description.length > 300) return { error: "A descrição vai até 300 caracteres." };
  if (!HEX.test(color)) return { error: "Escolha uma cor válida." };

  const { data, error } = await supabase
    .from("spaces")
    .update({ name, short, description: description || null, color, is_public, icon_url, banner_url })
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
  const username = String(form.get("username") ?? "").trim().toLowerCase().replace(/^@/, "");
  if (display_name.length < 1 || display_name.length > 60) return { error: "O nome precisa ter de 1 a 60 caracteres." };
  const { data: current } = await supabase.from("profiles").select("avatar_url, banner_url").eq("id", user.id).single<{ avatar_url: string | null; banner_url: string | null }>();
  const avatar_url = imageUrl(form, "avatar_url", "perfis", user.id, current?.avatar_url);
  const banner_url = imageUrl(form, "banner_url", "perfis", user.id, current?.banner_url);
  if (avatar_url === undefined || banner_url === undefined) return { error: "Imagem inválida. Envie de novo." };
  if (!/^[a-z0-9_.]{3,20}$/.test(username)) return { error: "O nick tem de 3 a 20 caracteres: letras minúsculas, números, ponto e sublinhado." };
  if (bio.length > 300) return { error: "A bio vai até 300 caracteres." };
  if (!HEX.test(color)) return { error: "Escolha uma cor válida." };

  const { error } = await supabase.from("profiles").update({ display_name, username, bio: bio || null, color, avatar_url, banner_url }).eq("id", user.id);
  if (error?.code === "23505") return { error: `O nick @${username} já está em uso.` };
  if (error) return { error: dbMessage(error, "Não foi possível salvar agora.") };
  revalidatePath("/", "layout");
  return { saved: true };
}

// ───────── Canais ─────────

const CHANNEL_KINDS = ["texto", "anuncios", "voz", "galeria", "funcional"] as const;
export type NewChannelKind = (typeof CHANNEL_KINDS)[number];

/** Cria um canal (e, se pedido, uma categoria nova para ele) e abre o canal criado. */
export async function createChannelAction(input: {
  spaceId: string;
  kind: NewChannelKind;
  name: string;
  topic?: string;
  categoryId: string | null;
  newCategory?: string;
}): Promise<{ error?: string }> {
  const { supabase } = await requireAccount();
  if (!CHANNEL_KINDS.includes(input.kind)) return { error: "Tipo de canal inválido." };
  let categoryId = input.categoryId;
  if (input.newCategory?.trim()) {
    const { data, error } = await supabase.rpc("create_category", { p_space: input.spaceId, p_name: input.newCategory });
    if (error || typeof data !== "string") return { error: dbMessage(error, "Não foi possível criar a categoria agora.") };
    categoryId = data;
  }
  const { data: channelId, error } = await supabase.rpc("create_channel", {
    p_space: input.spaceId,
    p_category: categoryId,
    p_kind: input.kind,
    p_name: input.name,
    p_topic: input.topic ?? null,
  });
  if (error || typeof channelId !== "string") return { error: dbMessage(error, "Não foi possível criar o canal agora.") };
  revalidatePath(`/c/${input.spaceId}`, "layout");
  redirect(appSpaceHref(input.spaceId, channelId));
}
