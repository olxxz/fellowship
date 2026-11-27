import { Permission } from "@fellowship/core";
import type { Metadata } from "next";
import { InviteList } from "@/components/account/InviteList";
import styles from "@/components/account/Settings.module.sass";
import { SpaceSettingsForm } from "@/components/account/SpaceSettingsForm";
import { EmptyState } from "@/components/common/EmptyState";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { getSpaceView, getStickers, requireAccount } from "@/lib/app/queries";
import { StickerManager } from "@/components/account/StickerManager";
import { listInvitesAction } from "@/lib/app/space-actions";

export const metadata: Metadata = { title: "Configurações do Cenário" };

export default async function SpaceSettingsPage({ params }: { params: Promise<{ space: string }> }) {
  const { space: spaceId } = await params;
  const { supabase, profile } = await requireAccount(`/c/${spaceId}/configuracoes`);
  const view = await getSpaceView(supabase, spaceId);
  const canManage = (view.permissions & Permission.MANAGE_THEME) !== 0;
  const canInvite = (view.permissions & Permission.CREATE_INVITES) !== 0;

  if (!canManage && !canInvite) {
    return (
      <>
        <ContentHeader icon="settings" title="Configurações" />
        <EmptyState icon="lock" title="Sem acesso às configurações">
          Só quem administra o Cenário muda nome, cor e convites.
        </EmptyState>
      </>
    );
  }

  const [invites, stickers] = await Promise.all([canInvite || canManage ? listInvitesAction(spaceId) : [], canManage ? getStickers(supabase, spaceId) : []]);

  return (
    <>
      <ContentHeader icon="settings" title="Configurações" topic={view.space.name} />
      <main className={styles.page}>
        <div className={styles.inner}>
          {canManage && (
            <section className={styles.section}>
              <div>
                <h2 className={styles.title}>Visão geral</h2>
                <p className={styles.lead}>Nome, ícone e cor do Cenário. Canais, cargos e permissões chegam nas próximas telas.</p>
              </div>
              <SpaceSettingsForm space={view.space} />
            </section>
          )}
          {canManage && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Figurinhas</h3>
              <StickerManager spaceId={spaceId} meId={profile.id} initial={stickers} />
            </section>
          )}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Convites</h3>
            <InviteList spaceId={spaceId} spaceName={view.space.name} invites={invites} canInvite={canInvite} />
          </section>
        </div>
      </main>
    </>
  );
}
