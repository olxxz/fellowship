import { Icon } from "@fellowship/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/account/GoogleButton";
import { campaignHref } from "@/lib/routes";
import { authEnabled, safeNext } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";
import styles from "./page.module.sass";

export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ next?: string; erro?: string }> }) {
  const { next: rawNext, erro } = await searchParams;
  const next = safeNext(rawNext);
  if (authEnabled) {
    const { user } = await getUser();
    if (user) redirect(next);
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.mark}>
          <Icon name="dice" size={26} />
        </span>
        <h1 className={styles.title}>Entrar no Fellowship</h1>
        <p className={styles.text}>Seus Cenários, campanhas e a Mesa do grupo. Na primeira vez, a conta é criada com o seu Google.</p>
        {erro && (
          <p className={styles.error} role="alert">
            Não deu para entrar. Tente de novo; se continuar, confira a configuração do Google no Supabase.
          </p>
        )}
        {authEnabled ? <GoogleButton next={next} /> : <p className={styles.error}>O login ainda não está configurado neste deploy.</p>}
        <p className={styles.small}>
          Só quer olhar?{" "}
          <Link className={styles.link} href={campaignHref("vel", "maldicao")}>
            Abra o protótipo da Mesa
          </Link>
          , sem conta.
        </p>
      </div>
    </main>
  );
}
