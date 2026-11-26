import { Icon } from "@fellowship/ui";
import Link from "next/link";
import { campaignHref, spaceHref } from "@/lib/routes";
import { authEnabled } from "@/lib/supabase/config";
import styles from "./page.module.sass";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.mark}>
          <Icon name="dice" size={30} />
        </span>
        <h1 className={styles.title}>Fellowship</h1>
        <p className={styles.lead}>
          Cenários, campanhas e a Mesa do seu grupo num lugar só.
          {authEnabled
            ? " Entre com o Google para criar seu Cenário, ou veja o protótipo da Mesa sem conta."
            : " Esta é a versão de demonstração: um protótipo navegável com dados de exemplo que ficam só no seu navegador."}
        </p>
        <div className={styles.links}>
          {authEnabled && (
            <Link className={`${styles.link} ${styles.primary}`} href="/entrar">
              Entrar com Google
            </Link>
          )}
          <Link className={`${styles.link} ${authEnabled ? "" : styles.primary}`} href={campaignHref("vel", "maldicao")}>
            {authEnabled ? "Ver a Mesa (protótipo)" : "Entrar na Mesa"}
          </Link>
          <Link className={styles.link} href={spaceHref("vel", "geral")}>
            {authEnabled ? "Cenário de exemplo" : "Abrir o Cenário"}
          </Link>
          <Link className={styles.link} href="/design-system">
            Ver o design system
          </Link>
        </div>
      </div>
    </main>
  );
}
