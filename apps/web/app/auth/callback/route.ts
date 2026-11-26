// Volta do Google: troca o código pela sessão e segue para onde a pessoa queria ir.
import { NextResponse, type NextRequest } from "next/server";
import { NEXT_COOKIE, safeNext } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next") ?? decodeCookie(request.cookies.get(NEXT_COOKIE)?.value));
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const res = NextResponse.redirect(`${origin}${next}`);
      res.cookies.delete(NEXT_COOKIE);
      return res;
    }
    console.error("Falha no login com Google", error.message);
  }
  return NextResponse.redirect(`${origin}/entrar?erro=1`);
}

function decodeCookie(value: string | undefined) {
  try {
    return value ? decodeURIComponent(value) : null;
  } catch {
    return null;
  }
}
