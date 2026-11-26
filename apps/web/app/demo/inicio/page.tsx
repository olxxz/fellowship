import { Button, playerColorStyle } from "@fellowship/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { Greeting } from "@/components/common/Greeting";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { spaces } from "@/lib/demo/data";
import { spaceHref } from "@/lib/routes";
import styles from "./page.module.sass";

export const metadata: Metadata = { title: "Início · protótipo" };

export default function InicioPage() {
  return (
    <>
      <ContentHeader icon="home" title="Início" />
      <main className={styles.page}>
        <Greeting className={styles.title} />
        <section className={styles.section}>
          <h3 className={styles.overline}>Convites pendentes</h3>
          <div className={styles.invite}>
            <p className={styles.inviteText}>
              <strong>Bruno</strong> convidou você para o Cenário <strong>Masmorras de Domingo</strong>.
            </p>
            <Button disabled>Recusar</Button>
            <Button variant="primary" disabled>
              Aceitar convite
            </Button>
          </div>
        </section>
        <section className={styles.section}>
          <h3 className={styles.overline}>Seus Cenários</h3>
          <div className={styles.grid}>
            {spaces.map((s) => (
              <Link key={s.id} href={spaceHref(s.id, "geral")} className={styles.space} style={playerColorStyle(s.color)}>
                <span className={styles.spaceName}>{s.name}</span>
                <span className={styles.spaceText}>{s.description}</span>
                <span className={styles.spaceText}>
                  {s.campaigns.length ? `${s.campaigns.length} campanhas · ${s.campaigns.filter((c) => c.live).length} ao vivo agora` : "Nenhuma campanha ainda"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
