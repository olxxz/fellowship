// Confirmação por e-mail com token_hash (funciona mesmo abrindo o e-mail em outro aparelho).
// Para usar, troque os modelos de e-mail do Supabase pelo link: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { NEXT_COOKIE, safeNext } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = type === "recovery" ? "/nova-senha" : safeNext(searchParams.get("next") ?? decodeCookie(request.cookies.get(NEXT_COOKIE)?.value));
  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const res = NextResponse.redirect(`${origin}${next}`);
      res.cookies.delete(NEXT_COOKIE);
      return res;
    }
    console.error("Falha ao confirmar e-mail", error.message);
  }
  return NextResponse.redirect(`${origin}/entrar?erro=link`);
}

function decodeCookie(value: string | undefined) {
  try {
    return value ? decodeURIComponent(value) : null;
  } catch {
    return null;
  }
}
