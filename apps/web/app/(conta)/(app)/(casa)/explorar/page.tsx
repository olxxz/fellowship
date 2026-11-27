import type { PublicSpace } from "@fellowship/db";
import type { Metadata } from "next";
import { ExploreList } from "@/components/account/ExploreList";
import styles from "@/components/account/Settings.module.sass";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { requireAccount } from "@/lib/app/queries";

export const metadata: Metadata = { title: "Explorar" };

export default async function ExplorarPage() {
  const { supabase } = await requireAccount("/explorar");
  const { data } = await supabase.rpc("list_public_spaces", { p_query: null });
  return (
    <>
      <ContentHeader icon="map" title="Explorar" />
      <main className={styles.page}>
        <div className={styles.innerWide}>
          <div>
            <h2 className={styles.title}>Explorar Cenários</h2>
            <p className={styles.lead}>Cenários públicos: qualquer conta entra, sem convite.</p>
          </div>
          <ExploreList initial={(data ?? []) as PublicSpace[]} />
        </div>
      </main>
    </>
  );
}
