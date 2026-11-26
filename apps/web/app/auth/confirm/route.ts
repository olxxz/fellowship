// Confirmação por e-mail com token_hash (funciona mesmo abrindo o e-mail em outro aparelho).
// Para usar, troque os modelos de e-mail do Supabase pelo link: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = type === "recovery" ? "/nova-senha" : safeNext(searchParams.get("next"));
  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("Falha ao confirmar e-mail", error.message);
  }
  return NextResponse.redirect(`${origin}/entrar?erro=link`);
}
