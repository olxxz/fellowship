// Gera o token de entrada na sala de voz da Mesa. Roda só no servidor: usa o segredo do LiveKit.
import { AccessToken } from "livekit-server-sdk";
import { spaces, userById } from "@/lib/demo/data";
import { mesaRoomName } from "./room";

export { mesaRoomName };

/** Só campanhas com sessão ao vivo têm sala. */
export function mesaRooms(): Set<string> {
  return new Set(spaces.flatMap((s) => s.campaigns.filter((c) => c.live).map((c) => mesaRoomName(s.id, c.id))));
}

export class TokenRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface TokenEnv {
  LIVEKIT_API_KEY?: string;
  LIVEKIT_API_SECRET?: string;
}

/**
 * Valida o pedido e devolve um JWT de 2 horas, válido só para aquela sala.
 * Ainda não há login: qualquer um com o link pode escolher um dos usuários do grupo.
 * Quando o Supabase entrar, o usuário vem da sessão e o papel (mestre, jogador) da campanha.
 */
export async function createMesaToken(body: unknown, env: TokenEnv) {
  const { room, userId } = (body ?? {}) as { room?: unknown; userId?: unknown };
  if (typeof room !== "string" || !mesaRooms().has(room)) throw new TokenRequestError("Sala desconhecida.", 400);
  const user = typeof userId === "string" ? userById(userId) : undefined;
  if (!user) throw new TokenRequestError("Usuário desconhecido.", 400);
  if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
    throw new TokenRequestError("Voz indisponível: faltam LIVEKIT_API_KEY e LIVEKIT_API_SECRET no servidor.", 503);
  }

  // Sufixo aleatório: a mesma pessoa em duas abas não derruba a outra conexão.
  const identity = `${user.id}-${crypto.randomUUID().slice(0, 6)}`;
  const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity,
    name: user.name,
    ttl: "2h",
    attributes: { userId: user.id },
  });
  token.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: false });
  return { token: await token.toJwt(), identity };
}
