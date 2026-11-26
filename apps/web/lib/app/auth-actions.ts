"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NEXT_COOKIE, safeNext } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface AuthFormState {
  error?: string;
  /** Mensagem de sucesso que não muda de página (ex.: "enviamos um e-mail"). */
  notice?: string;
  email?: string;
  name?: string;
}

const MIN_PASSWORD = 8;

/** Origem do site para os links de e-mail (funciona na Vercel, nas prévias e no localhost). */
async function siteOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** Mensagens do Supabase Auth em português, pelo código do erro. */
function authMessage(error: { code?: string; message: string; status?: number }) {
  switch (error.code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";
    case "email_not_confirmed":
      return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
    case "user_already_exists":
    case "email_exists":
      return "Já existe uma conta com esse e-mail. Entre ou recupere a senha.";
    case "weak_password":
      return `Senha fraca. Use pelo menos ${MIN_PASSWORD} caracteres, misturando letras e números.`;
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Muitas tentativas em pouco tempo. Espere alguns minutos e tente de novo.";
    case "email_address_invalid":
      return "Esse e-mail não parece válido.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "Cadastro com e-mail está desligado neste projeto. Use o Google ou ligue o provedor de e-mail no Supabase.";
    case "same_password":
      return "A senha nova precisa ser diferente da atual.";
    default:
      console.error("Erro de autenticação", error);
      return "Algo deu errado. Tente de novo em instantes.";
  }
}

export async function signInWithPassword(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? ""));
  if (!email || !password) return { error: "Preencha e-mail e senha.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authMessage(error), email };
  redirect(next);
}

export async function signUpWithPassword(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? ""));
  if (name.length < 1 || name.length > 60) return { error: "Diga como quer ser chamado (até 60 caracteres).", email, name };
  if (password.length < MIN_PASSWORD) return { error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`, email, name };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: authMessage(error), email, name };
  // Com "Confirm email" desligado no Supabase, a sessão já vem pronta.
  if (data.session) redirect(next);
  if (next !== "/inicio") (await cookies()).set(NEXT_COOKIE, encodeURIComponent(next), { path: "/", maxAge: 60 * 60 * 24, sameSite: "lax", secure: true });
  return { notice: `Enviamos um link de confirmação para ${email}. Abra o e-mail neste mesmo navegador para entrar.`, email, name };
}

export async function requestPasswordReset(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Digite o e-mail da conta." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent("/nova-senha")}`,
  });
  if (error && error.code !== "user_not_found") return { error: authMessage(error), email };
  // Mesma resposta exista ou não a conta, para não revelar quem tem cadastro.
  return { notice: `Se existir uma conta com ${email}, enviamos um link para criar uma senha nova.`, email };
}

export async function updatePassword(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD) return { error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` };
  if (password !== confirm) return { error: "As duas senhas não são iguais." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "O link expirou. Peça um novo em Esqueci minha senha." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authMessage(error) };
  redirect("/inicio");
}
