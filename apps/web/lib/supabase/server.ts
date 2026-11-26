import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config";

/** Cliente do Supabase para Server Components, Server Actions e rotas. Um por requisição. */
export async function createClient() {
  const { url, key } = supabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Em Server Components não dá para gravar cookies; o proxy.ts renova a sessão.
        }
      },
    },
  });
}

/** Usuário logado, validado no servidor do Supabase (não confia só no cookie). */
export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}
