import { Button, ButtonLink } from "@fellowship/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ProfileForm } from "@/components/account/ProfileForm";
import styles from "@/components/account/Settings.module.sass";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { requireAccount } from "@/lib/app/queries";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function ContaPage() {
  const { profile, user } = await requireAccount("/conta");
  const usesPassword = user.app_metadata?.providers?.includes("email");
  return (
    <>
      <ContentHeader icon="settings" title="Meu perfil" />
      <main className={styles.page}>
        <div className={styles.inner}>
          <div>
            <h2 className={styles.title}>Meu perfil</h2>
            <p className={styles.lead}>Como você aparece para o grupo, fora dos personagens.</p>
          </div>
          <ProfileForm profile={profile} />
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Conta</h3>
            <p className={styles.help}>
              Entrou como {user.email}
              {usesPassword ? "." : ", pelo Google."}
            </p>
            <div className={styles.actions}>
              {usesPassword && (
                <ButtonLink href="/recuperar-senha" linkAs={Link}>
                  Trocar senha
                </ButtonLink>
              )}
              <form action="/auth/sair" method="post">
                <Button type="submit" variant="danger" icon="leave">
                  Sair da conta
                </Button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
