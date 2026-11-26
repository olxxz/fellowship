import { Icon } from "@fellowship/ui";
import Link from "next/link";
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
          Cenários, campanhas e a Mesa do seu grupo num lugar só. Ainda em construção: este é um protótipo navegável, com dados de exemplo
          que ficam só no seu navegador.
        </p>
        <div className={styles.links}>
          <Link className={`${styles.link} ${styles.primary}`} href="/s/vel/campanha/maldicao">
            Entrar na Mesa
          </Link>
          <Link className={styles.link} href="/s/vel/geral">
            Abrir o Cenário
          </Link>
          <Link className={styles.link} href="/design-system">
            Ver o design system
          </Link>
        </div>
      </div>
    </main>
  );
}
