// Voz dos canais do app real. POST: token para entrar na sala do canal. GET ?space=<id>: quem está em cada sala.
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
    supabase.from("profiles").select("display_name, avatar_url, color").eq("id", user.id).maybeSingle<{ display_name: string; avatar_url: string | null; color: string }>(),
  ]);
  if (!channel) throw new TokenRequestError("Canal não encontrado.", 404);
  if (!VOICE_KINDS.has(channel.kind)) throw new TokenRequestError("Este canal não é de voz.", 400);
  return { user, channel, perms: (perms as number | null) ?? 0, name: profile?.display_name ?? "Alguém", avatarUrl: profile?.avatar_url ?? "", color: profile?.color ?? "" };
}

function fail(error: unknown) {
  if (error instanceof TokenRequestError) return Response.json({ error: error.message, login: error.status === 401 }, { status: error.status, headers: noStore });
  console.error("Falha na voz do canal", error);
  return Response.json({ error: "Não foi possível entrar na voz agora." }, { status: 500, headers: noStore });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { channelId?: unknown };
    const { user, channel, perms, name, avatarUrl, color } = await loadVoiceChannel(body.channelId);
    const { token, identity } = await createChannelToken(
      { channelId: channel.id, userId: user.id, name, avatarUrl, color, canPublish: (perms & Permission.SPEAK) !== 0 },
      { LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY, LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET },
    );
    return Response.json({ token, identity, url: process.env.NEXT_PUBLIC_LIVEKIT_URL, canSpeak: (perms & Permission.SPEAK) !== 0 }, { headers: noStore });
  } catch (error) {
    return fail(error);
  }
}

export interface VoicePresent {
  userId: string;
  name: string;
  avatarUrl: string;
  color: string;
}

/** GET ?space=<id>: quem está em cada sala de voz do Cenário (só os canais que a pessoa vê). */
export async function GET(request: Request) {
  try {
    if (!authEnabled) throw new TokenRequestError("Voz indisponível sem login configurado.", 503);
    const spaceId = new URL(request.url).searchParams.get("space");
    if (!spaceId || !/^[0-9a-f-]{36}$/i.test(spaceId)) throw new TokenRequestError("Cenário inválido.", 400);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new TokenRequestError("Entre na sua conta para usar a voz.", 401);
    const { data: channels } = await supabase.from("channels").select("id").eq("space_id", spaceId).in("kind", [...VOICE_KINDS]);
    const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    const { LIVEKIT_API_KEY: key, LIVEKIT_API_SECRET: secret } = process.env;
    if (!url || !key || !secret || !channels?.length) return Response.json({ rooms: {} }, { headers: noStore });
    const service = new RoomServiceClient(url.replace(/^ws/, "http"), key, secret);
    const names = channels.map((c) => channelRoomName(c.id));
    const active = (await service.listRooms(names).catch(() => [])).filter((r) => r.numParticipants > 0);
    const rooms: Record<string, VoicePresent[]> = {};
    await Promise.all(
      active.map(async (room) => {
        const list = await service.listParticipants(room.name).catch(() => []);
        const seen = new Set<string>();
        rooms[room.name.replace(/^canal-/, "")] = list
          .map((p) => ({
            userId: p.attributes?.userId ?? p.identity.slice(0, 36),
            name: p.name || "Alguém",
            avatarUrl: p.attributes?.avatarUrl ?? "",
            color: p.attributes?.color ?? "",
          }))
          .filter((p) => (seen.has(p.userId) ? false : (seen.add(p.userId), true)));
      }),
    );
    return Response.json({ rooms }, { headers: noStore });
  } catch (error) {
    return fail(error);
  }
}
