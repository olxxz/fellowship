// Renova a sessão do Supabase a cada navegação e manda para /entrar quem tenta abrir o app sem login.
// As páginas e ações também conferem o usuário: o proxy não é a única barreira.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authEnabled, supabaseConfig } from "@/lib/supabase/config";

const PROTECTED = ["/inicio", "/c/", "/criar-cenario", "/conta", "/nova-senha", "/amigos", "/explorar", "/perfil", "/u/", "/mensagens/"];

export async function proxy(request: NextRequest) {
  if (!authEnabled) return NextResponse.next();

  let response = NextResponse.next({ request });
  const { url, key } = supabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet, headers) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  if (!data.user && PROTECTED.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`))) {
    const login = request.nextUrl.clone();
    login.pathname = "/entrar";
    login.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  // Não roda em arquivos estáticos, imagens, no protótipo (/demo) nem no design system.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|demo|design-system|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
