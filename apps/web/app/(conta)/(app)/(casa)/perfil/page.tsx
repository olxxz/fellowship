import { ButtonLink } from "@fellowship/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ProfileCardView } from "@/components/account/ProfileCardView";
import styles from "@/components/account/Settings.module.sass";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { requireAccount } from "@/lib/app/queries";
import { editProfileHref, friendsHref } from "@/lib/routes";

export const metadata: Metadata = { title: "Seu perfil" };

/** O próprio perfil, do jeito que os outros veem. */
export default async function PerfilPage() {
  const { profile } = await requireAccount("/perfil");
  return (
    <>
      <ContentHeader icon="users" title="Seu perfil" />
      <main className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.lead}>É assim que os outros veem você.</p>
          <ProfileCardView profile={profile}>
            <ButtonLink href={editProfileHref} linkAs={Link} variant="primary" icon="settings">
              Editar perfil
            </ButtonLink>
            <ButtonLink href={friendsHref} linkAs={Link} icon="userPlus">
              Amigos e link de convite
            </ButtonLink>
          </ProfileCardView>
        </div>
      </main>
    </>
  );
}
