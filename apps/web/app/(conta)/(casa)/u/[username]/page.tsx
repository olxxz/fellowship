import type { ProfileCard } from "@fellowship/db";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProfileActions } from "@/components/account/ProfileActions";
import { ProfileCardView } from "@/components/account/ProfileCardView";
import styles from "@/components/account/Settings.module.sass";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { requireAccount } from "@/lib/app/queries";
import { myProfileHref } from "@/lib/routes";

type Params = Promise<{ username: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: `@${(await params).username}` };
}

export default async function UserPage({ params }: { params: Params }) {
  const { username } = await params;
  const { supabase } = await requireAccount(`/u/${username}`);
  const { data } = await supabase.rpc("find_profile", { p_username: username });
  const card = (Array.isArray(data) ? data[0] : null) as ProfileCard | null;
  if (!card) notFound();
  if (card.friendship === "voce") redirect(myProfileHref);
  return (
    <>
      <ContentHeader icon="users" title={card.display_name} />
      <main className={styles.page}>
        <div className={styles.inner}>
          <ProfileCardView profile={card}>
            <ProfileActions id={card.id} username={card.username} initial={card.friendship} />
          </ProfileCardView>
        </div>
      </main>
    </>
  );
}
