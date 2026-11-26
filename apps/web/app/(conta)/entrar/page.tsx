import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/account/GoogleButton";
import { AuthCard, Divider } from "@/components/auth/AuthCard";
import styles from "@/components/auth/Auth.module.sass";
import { SignInForm } from "@/components/auth/AuthForms";
import { APP_NAME } from "@/lib/brand";
import { campaignHref } from "@/lib/routes";
import { authEnabled, safeNext } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Entrar" };

const ERRORS: Record<string, string> = {
  "1": "Não deu para entrar com o Google. Tente de novo.",
  link: "O link do e-mail expirou ou já foi usado. Entre com sua senha ou peça um link novo.",
  perfil: "Sua conta existe, mas o perfil não foi encontrado. Fale com quem administra o app.",
};

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ next?: string; erro?: string }> }) {
  const { next: rawNext, erro } = await searchParams;
  const next = safeNext(rawNext);
  if (authEnabled) {
    const { user } = await getUser();
    if (user) redirect(next);
  }
  const signUpHref = next === "/inicio" ? "/cadastro" : `/cadastro?next=${encodeURIComponent(next)}`;

  return (
    <AuthCard
      title={`Entrar no ${APP_NAME}`}
      text="Seus Cenários, campanhas e a Mesa do grupo."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link className={styles.link} href={signUpHref}>
            Criar conta
          </Link>
          {" · "}
          <Link className={styles.link} href={campaignHref("vel", "maldicao")}>
            Ver a Mesa sem conta
          </Link>
        </>
      }
    >
      {erro && ERRORS[erro] && (
        <p className={styles.error} role="alert">
          {ERRORS[erro]}
        </p>
      )}
      {authEnabled ? (
        <>
          <GoogleButton next={next} />
          <Divider />
          <SignInForm next={next} />
        </>
      ) : (
        <p className={styles.error}>O login ainda não está configurado neste deploy.</p>
      )}
    </AuthCard>
  );
}
