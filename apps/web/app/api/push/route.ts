// Envia as notificações de uma mensagem nova. Quem chama é o autor (conferido pelo banco, com o login dele);
// quem recebe é decidido por push_targets (menções que podem ver o canal; a outra pessoa da conversa).
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import * as webpush from "web-push";
import { authEnabled } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const { NEXT_PUBLIC_VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, VAPID_SUBJECT: subject, SUPABASE_SERVICE_ROLE_KEY: service, NEXT_PUBLIC_SUPABASE_URL: url } = process.env;

/** O web-push exige "mailto:" ou https:// no assunto; um e-mail puro fazia todo envio falhar. */
function vapidSubject() {
  const s = (subject ?? "").trim();
  if (/^(mailto:|https:\/\/)/.test(s)) return s;
  if (s.includes("@")) return `mailto:${s}`;
  return "mailto:contato@exemplo.com";
}

const missing = () =>
  Object.entries({ NEXT_PUBLIC_VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, SUPABASE_SERVICE_ROLE_KEY: service, NEXT_PUBLIC_SUPABASE_URL: url })
    .filter(([, v]) => !v)
    .map(([k]) => k);

type Target = { endpoint: string; p256dh: string; auth: string; title: string; body: string; url: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function send(admin: SupabaseClient<any>, targets: Target[]) {
  webpush.setVapidDetails(vapidSubject(), pub!, priv!);
  let sent = 0;
  const errors: string[] = [];
  await Promise.all(
    targets.map(async (t) => {
      try {
        await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, JSON.stringify({ title: t.title, body: t.body, url: t.url, tag: t.url }), { TTL: 3600 });
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // Aparelho desinscrito ou expirado: some da lista.
        if (status === 404 || status === 410) await admin.from("push_subscriptions").delete().eq("endpoint", t.endpoint);
        errors.push(status ? `${status}: ${(e as { body?: string }).body ?? ""}`.trim() : e instanceof Error ? e.message : "erro");
        console.error("push", status, e);
      }
    }),
  );
  return { sent, errors };
}

export async function POST(request: Request) {
  if (!authEnabled || missing().length) return Response.json({ sent: 0, disabled: true, missing: missing() });
  const body = (await request.json().catch(() => ({}))) as { kind?: string; messageId?: string };
  // Teste: manda um aviso para os aparelhos da própria conta e diz o que deu errado.
  if (body.kind === "teste") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    const admin = createServiceClient(url!, service!, { auth: { persistSession: false } });
    const { data: subs } = await admin.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", user.id);
    const targets = ((subs ?? []) as Target[]).map((s) => ({ ...s, title: "Notificações ligadas", body: "É assim que os avisos vão chegar.", url: "/inicio" }));
    if (!targets.length) return Response.json({ sent: 0, devices: 0 });
    return Response.json({ ...(await send(admin, targets)), devices: targets.length });
  }
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

  const admin = createServiceClient(url!, service!, { auth: { persistSession: false } });
  const { data: targets } = await admin.rpc("push_targets", { p_kind: body.kind, p_message: body.messageId });
  const result = await send(admin, (targets ?? []) as Target[]);
  return Response.json(result);
}
