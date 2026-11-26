import type { InvitePreview } from "@fellowship/db";
import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";
import { APP_NAME } from "@/lib/brand";
import { InviteOgCard, ogFonts, SiteOgCard } from "@/lib/og";
import { supabaseConfig } from "@/lib/supabase/config";

export const alt = `Convite para um Cenário no ${APP_NAME}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Sem cookies: quem gera a prévia é o robô do app de mensagens, como visitante. */
async function loadInvite(code: string): Promise<InvitePreview | null> {
  try {
    const { url, key } = supabaseConfig();
    const { data } = await createClient(url, key, { auth: { persistSession: false } }).rpc("get_invite", { p_code: code });
    return (Array.isArray(data) ? data[0] : null) as InvitePreview | null;
  } catch {
    return null;
  }
}

/** Prévia do convite (WhatsApp, Discord, Telegram): nome, cor e iniciais do Cenário e quem convidou. */
export default async function InviteOgImage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const invite = await loadInvite(code);
  const options = { ...size, fonts: await ogFonts() };
  if (!invite || invite.status !== "valido") return new ImageResponse(<SiteOgCard />, options);
  return new ImageResponse(
    <InviteOgCard name={invite.name} short={invite.short} color={invite.color} inviter={invite.inviter} memberCount={invite.member_count} description={invite.description} />,
    options,
  );
}
