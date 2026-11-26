// Volta do Google: troca o código pela sessão e segue para onde a pessoa queria ir.
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("Falha no login com Google", error.message);
  }
  return NextResponse.redirect(`${origin}/entrar?erro=1`);
}
