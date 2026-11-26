/** Login e dados reais só existem no deploy com servidor e com o Supabase configurado. */
export const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "1";

export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Chave pública: o nome novo (publishable) ou o antigo (anon), que a integração da Vercel ainda cria.
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  return { url, key };
}

/** Só aceita caminhos internos depois do login (evita redirecionar para outro site). */
export function safeNext(next: string | null | undefined, fallback = "/inicio") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
