// Rota do token de voz. Só existe no deploy com servidor (Vercel); o build estático do Pages não a inclui
// (ver pageExtensions no next.config.ts).
import { createMesaToken, TokenRequestError } from "@/lib/livekit/token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corpo inválido." }, { status: 400 });
  }
  try {
    const { token, identity } = await createMesaToken(body, {
      LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
    });
    return Response.json({ token, identity, url: process.env.NEXT_PUBLIC_LIVEKIT_URL }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof TokenRequestError) return Response.json({ error: error.message }, { status: error.status });
    console.error("Falha ao gerar token do LiveKit", error);
    return Response.json({ error: "Não foi possível entrar na voz agora." }, { status: 500 });
  }
}
