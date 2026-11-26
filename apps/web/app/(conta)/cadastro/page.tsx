import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/account/GoogleButton";
import { AuthCard, Divider } from "@/components/auth/AuthCard";
import styles from "@/components/auth/Auth.module.sass";
import { SignUpForm } from "@/components/auth/AuthForms";
import { authEnabled, safeNext } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Criar conta" };

export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (!authEnabled) redirect("/entrar");
  const { user } = await getUser();
  if (user) redirect(next);
  const signInHref = next === "/inicio" ? "/entrar" : `/entrar?next=${encodeURIComponent(next)}`;

  return (
    <AuthCard
      title="Criar conta"
      text="Grátis. Com o Google é um clique; com e-mail, você confirma pelo link que enviamos."
      footer={
        <>
          Já tem conta?{" "}
          <Link className={styles.link} href={signInHref}>
            Entrar
          </Link>
        </>
      }
    >
      <GoogleButton next={next} label="Criar conta com Google" />
      <Divider />
      <SignUpForm next={next} />
    </AuthCard>
  );
}
