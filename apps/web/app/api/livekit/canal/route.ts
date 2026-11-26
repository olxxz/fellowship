// Voz dos canais do app real. POST: token para entrar na sala do canal. GET ?canal=<id>: quem está na sala agora.
// Só existe no deploy com servidor (o build estático do Pages não inclui rotas .ts).
import { Permission } from "@fellowship/core";
import { RoomServiceClient } from "livekit-server-sdk";
import { channelRoomName, createChannelToken, TokenRequestError } from "@/lib/livekit/token";
import { authEnabled } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VOICE_KINDS = new Set(["voz", "voz_dinamica"]);
const noStore = { "Cache-Control": "no-store" };

/** Confere com o RLS da própria pessoa que ela vê o canal e que ele é de voz. */
async function loadVoiceChannel(channelId: unknown) {
  if (!authEnabled) throw new TokenRequestError("Voz indisponível sem login configurado.", 503);
  if (typeof channelId !== "string" || !/^[0-9a-f-]{36}$/i.test(channelId)) throw new TokenRequestError("Canal inválido.", 400);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new TokenRequestError("Entre na sua conta para usar a voz.", 401);
  const [{ data: channel }, { data: perms }, { data: profile }] = await Promise.all([
    supabase.from("channels").select("id, kind").eq("id", channelId).maybeSingle<{ id: string; kind: string }>(),
    supabase.rpc("channel_permissions", { p_channel: channelId }),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle<{ display_name: string }>(),
  ]);
  if (!channel) throw new TokenRequestError("Canal não encontrado.", 404);
  if (!VOICE_KINDS.has(channel.kind)) throw new TokenRequestError("Este canal não é de voz.", 400);
  return { user, channel, perms: (perms as number | null) ?? 0, name: profile?.display_name ?? "Alguém" };
}

function fail(error: unknown) {
  if (error instanceof TokenRequestError) return Response.json({ error: error.message, login: error.status === 401 }, { status: error.status, headers: noStore });
  console.error("Falha na voz do canal", error);
  return Response.json({ error: "Não foi possível entrar na voz agora." }, { status: 500, headers: noStore });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { channelId?: unknown };
    const { user, channel, perms, name } = await loadVoiceChannel(body.channelId);
    const { token, identity } = await createChannelToken(
      { channelId: channel.id, userId: user.id, name, canPublish: (perms & Permission.SPEAK) !== 0 },
      { LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY, LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET },
    );
    return Response.json({ token, identity, url: process.env.NEXT_PUBLIC_LIVEKIT_URL, canSpeak: (perms & Permission.SPEAK) !== 0 }, { headers: noStore });
  } catch (error) {
    return fail(error);
  }
}

export async function GET(request: Request) {
  try {
    const { channel } = await loadVoiceChannel(new URL(request.url).searchParams.get("canal"));
    const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    const { LIVEKIT_API_KEY: key, LIVEKIT_API_SECRET: secret } = process.env;
    if (!url || !key || !secret) return Response.json({ participants: [] }, { headers: noStore });
    const service = new RoomServiceClient(url.replace(/^ws/, "http"), key, secret);
    const list = await service.listParticipants(channelRoomName(channel.id)).catch(() => []);
    const seen = new Set<string>();
    const participants = list
      .map((p) => ({ userId: p.attributes?.userId ?? p.identity.slice(0, 36), name: p.name || "Alguém" }))
      .filter((p) => (seen.has(p.userId) ? false : (seen.add(p.userId), true)));
    return Response.json({ participants }, { headers: noStore });
  } catch (error) {
    return fail(error);
  }
}
