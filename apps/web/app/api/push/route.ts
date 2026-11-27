// Envia as notificações de uma mensagem nova. Quem chama é o autor (conferido pelo banco, com o login dele);
// quem recebe é decidido por push_targets (menções que podem ver o canal; a outra pessoa da conversa).
import { createClient as createServiceClient } from "@supabase/supabase-js";
import * as webpush from "web-push";
import { authEnabled } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const { NEXT_PUBLIC_VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, VAPID_SUBJECT: subject, SUPABASE_SERVICE_ROLE_KEY: service, NEXT_PUBLIC_SUPABASE_URL: url } = process.env;

export async function POST(request: Request) {
  if (!authEnabled || !pub || !priv || !service || !url) return Response.json({ sent: 0, disabled: true });
  const body = (await request.json().catch(() => ({}))) as { kind?: string; messageId?: string };
  if ((body.kind !== "canal" && body.kind !== "dm") || !body.messageId || !/^[0-9a-f-]{36}$/i.test(body.messageId)) {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
  const table = body.kind === "dm" ? "direct_messages" : "messages";
  const { data: msg } = await supabase.from(table).select("author_id, created_at").eq("id", body.messageId).maybeSingle<{ author_id: string; created_at: string }>();
  // Só o autor, e só logo depois de enviar (evita reenviar avisos de mensagens antigas).
  if (!msg || msg.author_id !== user.id || Date.now() - new Date(msg.created_at).getTime() > 120_000) {
    return Response.json({ error: "Mensagem não encontrada." }, { status: 404 });
  }

  const admin = createServiceClient(url, service, { auth: { persistSession: false } });
  const { data: targets } = await admin.rpc("push_targets", { p_kind: body.kind, p_message: body.messageId });
  webpush.setVapidDetails(subject || "mailto:contato@exemplo.com", pub, priv);
  let sent = 0;
  await Promise.all(
    ((targets ?? []) as { endpoint: string; p256dh: string; auth: string; title: string; body: string; url: string }[]).map(async (t) => {
      try {
        await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, JSON.stringify({ title: t.title, body: t.body, url: t.url, tag: t.url }), { TTL: 3600 });
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // Aparelho desinscrito ou expirado: some da lista.
        if (status === 404 || status === 410) await admin.from("push_subscriptions").delete().eq("endpoint", t.endpoint);
      }
    }),
  );
  return Response.json({ sent });
}
