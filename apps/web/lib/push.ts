"use client";

import { getBrowserClient } from "@/lib/supabase/client";

// Notificações no aparelho (Web Push). No iPhone só funcionam com o app instalado na tela de início (iOS 16.4+).

export const pushKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushSupport = "ok" | "sem-chave" | "sem-suporte" | "instalar";

export function pushSupport(): PushSupport {
  if (!pushKey) return "sem-chave";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  if (ios && !standalone) return "instalar";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "sem-suporte";
  return "ok";
}

function keyBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function currentSubscription() {
  if (pushSupport() !== "ok") return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** Pede permissão, inscreve este aparelho e guarda a inscrição na conta. */
export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("As notificações foram bloqueadas. Libere nas configurações do navegador ou do celular.");
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(pushKey) }));
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const supabase = getBrowserClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Entre na sua conta.");
  const { error } = await supabase.from("push_subscriptions").insert({ user_id: data.user.id, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth });
  if (error && error.code !== "23505") throw new Error("Não foi possível salvar as notificações agora.");
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await getBrowserClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

/** Depois de enviar uma mensagem: o servidor decide quem avisar (menções e conversas diretas). */
export function notifyPush(kind: "canal" | "dm", messageId: string) {
  void fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, messageId }), keepalive: true }).catch(() => {});
}

/** Manda um aviso de teste para os aparelhos da própria conta e explica o que falhou. */
export async function testPush(): Promise<string | null> {
  const r = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "teste" }) });
  const data = (await r.json().catch(() => ({}))) as { sent?: number; devices?: number; disabled?: boolean; missing?: string[]; errors?: string[]; error?: string };
  if (data.error) return data.error;
  if (data.disabled) return `Falta configurar no servidor: ${(data.missing ?? []).join(", ") || "o login"}. Depois de salvar na Vercel, faça um novo deploy.`;
  if (!data.devices) return "Nenhum aparelho inscrito. Desligue e ligue as notificações de novo.";
  if (!data.sent) return `O envio falhou (${data.errors?.[0] ?? "erro desconhecido"}). Desligue e ligue as notificações de novo; se continuar, as chaves VAPID da Vercel não batem.`;
  return null;
}
