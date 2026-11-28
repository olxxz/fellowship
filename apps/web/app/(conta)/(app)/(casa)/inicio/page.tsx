import { ButtonLink, Icon, playerColorStyle } from "@fellowship/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { NotificationsPrompt } from "@/components/account/NotificationsPrompt";
import { EmptyState } from "@/components/common/EmptyState";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { getMySpaces, requireAccount } from "@/lib/app/queries";
import { appSpaceHref, createSpaceHref } from "@/lib/routes";
import styles from "./page.module.sass";

export const metadata: Metadata = { title: "Início" };

export default async function InicioPage() {
  const { supabase, profile } = await requireAccount();
  const spaces = await getMySpaces(supabase);
  const firstName = profile.display_name.split(" ")[0];

  return (
    <>
      <ContentHeader icon="home" title="Início" />
      <main className={styles.page}>
        <h2 className={styles.title}>Olá, {firstName}</h2>
        <NotificationsPrompt />
        {spaces.length === 0 ? (
          <EmptyState
            icon="dice"
            title="Nenhum Cenário ainda"
            actions={
              <ButtonLink href={createSpaceHref} linkAs={Link} variant="primary" icon="plus">
                Criar Cenário
              </ButtonLink>
            }
          >
            Um Cenário é o universo do grupo: canais, compêndio e as campanhas que acontecem nesse mundo.
          </EmptyState>
        ) : (
          <section className={styles.section}>
            <h3 className={styles.overline}>Seus Cenários</h3>
            <div className={styles.grid}>
              {spaces.map((s) => (
                <Link key={s.id} href={appSpaceHref(s.id)} className={styles.space} style={playerColorStyle(s.color)}>
                  <span className={styles.spaceName}>{s.name}</span>
                  {s.description && <span className={styles.spaceText}>{s.description}</span>}
                  <span className={styles.spaceText}>{s.owner_id === profile.id ? "Você é o dono" : "Membro"}</span>
                </Link>
              ))}
              <Link href={createSpaceHref} className={styles.create}>
                <Icon name="plus" size={22} />
                Criar Cenário
              </Link>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
