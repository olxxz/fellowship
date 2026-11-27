import type { Metadata } from "next";
import { FriendsPanel } from "@/components/account/FriendsPanel";
import styles from "@/components/account/Settings.module.sass";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { getFriendsView, requireAccount } from "@/lib/app/queries";

export const metadata: Metadata = { title: "Amigos" };

export default async function AmigosPage() {
  const { supabase, profile } = await requireAccount("/amigos");
  const view = await getFriendsView(supabase, profile.id);
  return (
    <>
      <ContentHeader icon="users" title="Amigos" />
      <main className={styles.page}>
        <div className={styles.inner}>
          <div>
            <h2 className={styles.title}>Amigos</h2>
            <p className={styles.lead}>Adicione pelo nick ou mande seu link. Amigos conversam direto, fora dos Cenários.</p>
          </div>
          <FriendsPanel me={profile} {...view} />
        </div>
      </main>
    </>
  );
}
