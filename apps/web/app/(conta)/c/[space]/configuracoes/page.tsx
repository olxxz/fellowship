import { Permission } from "@fellowship/core";
import type { Metadata } from "next";
import { InviteList } from "@/components/account/InviteList";
import styles from "@/components/account/Settings.module.sass";
import { SpaceSettingsForm } from "@/components/account/SpaceSettingsForm";
import { EmptyState } from "@/components/common/EmptyState";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { getSpaceView, requireAccount } from "@/lib/app/queries";
import { listInvitesAction } from "@/lib/app/space-actions";

export const metadata: Metadata = { title: "Configurações do Cenário" };

export default async function SpaceSettingsPage({ params }: { params: Promise<{ space: string }> }) {
  const { space: spaceId } = await params;
  const { supabase } = await requireAccount(`/c/${spaceId}/configuracoes`);
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

  const invites = canInvite || canManage ? await listInvitesAction(spaceId) : [];

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
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Convites</h3>
            <InviteList spaceId={spaceId} spaceName={view.space.name} invites={invites} canInvite={canInvite} />
          </section>
        </div>
      </main>
    </>
  );
}
