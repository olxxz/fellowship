// Rolagem de dados: o servidor sorteia (crypto) e grava a mensagem de rolagem com a chave de serviço.
// Quem rola precisa poder escrever no canal; rolar "como" um personagem exige ser o dono ou o mestre.
// Oculta: só o autor e o mestre do canal veem (a regra está no banco).
import { DiceError, roll } from "@fellowship/core";
import type { RollPayload } from "@fellowship/db";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { randomInt } from "node:crypto";
import { authEnabled } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;
const COLUMNS = "id, author_id, content, created_at, kind, edited_at, reply_to, mentions, attachments";

export async function POST(request: Request) {
  const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: service } = process.env;
  if (!authEnabled || !url) return Response.json({ error: "Rolagens precisam do app com login." }, { status: 503 });
  if (!service) return Response.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY no servidor para gravar rolagens." }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { channelId?: string; formula?: string; label?: string; characterId?: string | null; hidden?: boolean };
  if (!body.channelId || !UUID.test(body.channelId) || typeof body.formula !== "string") return Response.json({ error: "Pedido inválido." }, { status: 400 });
  const label = typeof body.label === "string" ? body.label.trim().slice(0, 80) : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });

  const [{ data: channel }, { data: perms }] = await Promise.all([
    supabase.from("channels").select("id, space_id, kind, campaign_id").eq("id", body.channelId).maybeSingle<{ id: string; space_id: string; kind: string; campaign_id: string | null }>(),
    supabase.rpc("channel_permissions", { p_channel: body.channelId }),
  ]);
  if (!channel || !["texto", "anuncios"].includes(channel.kind) || (((perms as number | null) ?? 0) & 2) === 0) {
    return Response.json({ error: "Você não pode rolar neste canal." }, { status: 403 });
  }

  let character: RollPayload["character"];
  if (body.characterId) {
    if (!UUID.test(body.characterId)) return Response.json({ error: "Personagem inválido." }, { status: 400 });
    const { data: c } = await supabase
      .from("characters")
      .select("id, name, color, portrait_url, owner_id, campaign_id")
      .eq("id", body.characterId)
      .maybeSingle<{ id: string; name: string; color: string; portrait_url: string | null; owner_id: string | null; campaign_id: string }>();
    if (!c) return Response.json({ error: "Personagem não encontrado." }, { status: 404 });
    let allowed = c.owner_id === user.id;
    if (!allowed) {
      const { data: role } = await supabase.from("campaign_members").select("role").eq("campaign_id", c.campaign_id).eq("user_id", user.id).maybeSingle<{ role: string }>();
      const { data: space } = await supabase.from("spaces").select("owner_id").eq("id", channel.space_id).maybeSingle<{ owner_id: string }>();
      allowed = role?.role === "mestre" || space?.owner_id === user.id;
    }
    if (!allowed) return Response.json({ error: "Só o dono ou o mestre rola por este personagem." }, { status: 403 });
    character = { id: c.id, name: c.name, color: c.color, portrait_url: c.portrait_url };
  }

  let result;
  try {
    result = roll(body.formula, (sides) => randomInt(1, sides + 1));
  } catch (e) {
    return Response.json({ error: e instanceof DiceError ? e.message : "Fórmula inválida." }, { status: 400 });
  }
  const payload: RollPayload = { ...result, ...(label ? { label } : {}), ...(character ? { character } : {}) };

  const admin = createServiceClient(url, service, { auth: { persistSession: false } });
  const { data, error } = await admin
    .from("messages")
    .insert({
      space_id: channel.space_id,
      channel_id: channel.id,
      author_id: user.id,
      kind: "rolagem",
      content: JSON.stringify(payload),
      visibility: body.hidden ? "mestre" : "todos",
    })
    .select(COLUMNS)
    .single();
  if (error || !data) {
    console.error("Falha ao gravar rolagem", error);
    return Response.json({ error: "Não foi possível gravar a rolagem." }, { status: 500 });
  }
  return Response.json({ message: { ...data, visibility: body.hidden ? "mestre" : "todos" } });
}
