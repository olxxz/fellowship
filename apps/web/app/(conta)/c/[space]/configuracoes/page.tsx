import { Permission } from "@fellowship/core";
import type { Metadata } from "next";
import { ChannelsManager } from "@/components/account/ChannelsManager";
import { DangerZone } from "@/components/account/DangerZone";
import { InviteList } from "@/components/account/InviteList";
import { MembersManager } from "@/components/account/MembersManager";
import { RolesManager } from "@/components/account/RolesManager";
import { SettingsTabs } from "@/components/account/SettingsTabs";
import styles from "@/components/account/Settings.module.sass";
import { SpaceSettingsForm } from "@/components/account/SpaceSettingsForm";
import { StickerManager } from "@/components/account/StickerManager";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { getSpaceView, getStickers, requireAccount } from "@/lib/app/queries";
import { listInvitesAction } from "@/lib/app/space-actions";

export const metadata: Metadata = { title: "Configurações do Cenário" };

export default async function SpaceSettingsPage({ params, searchParams }: { params: Promise<{ space: string }>; searchParams: Promise<{ aba?: string }> }) {
  const { space: spaceId } = await params;
  const { aba } = await searchParams;
  const { supabase, profile } = await requireAccount(`/c/${spaceId}/configuracoes`);
  const view = await getSpaceView(supabase, spaceId);
  const p = view.permissions;
  const has = (bit: number) => (p & bit) !== 0;
  const isOwner = view.space.owner_id === profile.id;
  const me = view.members.find((m) => m.user_id === profile.id);
  const myTop = isOwner ? 2147483647 : Math.max(-1, ...view.roles.filter((r) => me?.roleIds.includes(r.id)).map((r) => r.position));
  const memberCounts: Record<string, number> = {};
  for (const m of view.members) for (const id of m.roleIds) memberCounts[id] = (memberCounts[id] ?? 0) + 1;

  const [invites, stickers] = await Promise.all([
    has(Permission.CREATE_INVITES) || has(Permission.MANAGE_THEME) ? listInvitesAction(spaceId) : [],
    has(Permission.MANAGE_THEME) ? getStickers(supabase, spaceId) : [],
  ]);

  const tabs = [
    has(Permission.MANAGE_THEME) && {
      id: "geral",
      label: "Visão geral",
      content: <SpaceSettingsForm space={view.space} />,
    },
    has(Permission.MANAGE_CHANNELS) && {
      id: "canais",
      label: "Canais",
      content: <ChannelsManager spaceId={spaceId} categories={view.categories} channels={view.channels} roles={view.roles} />,
    },
    has(Permission.MANAGE_ROLES) && {
      id: "cargos",
      label: "Cargos",
      content: <RolesManager spaceId={spaceId} roles={view.roles} memberCounts={memberCounts} myTop={myTop} myPerms={p} />,
    },
    (has(Permission.MANAGE_ROLES) || has(Permission.KICK_MEMBERS)) && {
      id: "membros",
      label: "Membros",
      content: (
        <MembersManager
          spaceId={spaceId}
          members={view.members}
          roles={view.roles}
          ownerId={view.space.owner_id}
          meId={profile.id}
          myTop={myTop}
          canRoles={has(Permission.MANAGE_ROLES)}
          canKick={has(Permission.KICK_MEMBERS)}
        />
      ),
    },
    has(Permission.MANAGE_THEME) && {
      id: "figurinhas",
      label: "Figurinhas",
      content: <StickerManager spaceId={spaceId} meId={profile.id} initial={stickers} />,
    },
    (has(Permission.CREATE_INVITES) || has(Permission.MANAGE_THEME)) && {
      id: "convites",
      label: "Convites",
      content: <InviteList spaceId={spaceId} spaceName={view.space.name} invites={invites} canInvite={has(Permission.CREATE_INVITES)} />,
    },
    {
      id: "sair",
      label: isOwner ? "Apagar" : "Sair",
      content: <DangerZone spaceId={spaceId} spaceName={view.space.name} isOwner={isOwner} />,
    },
  ].filter((t): t is { id: string; label: string; content: React.ReactElement } => !!t);

  return (
    <>
      <ContentHeader icon="settings" title="Configurações" topic={view.space.name} />
      <main className={styles.page}>
        <div className={styles.innerWide}>
          <h2 className={styles.title}>{view.space.name}</h2>
          <SettingsTabs tabs={tabs} initial={tabs.some((t) => t.id === aba) ? aba! : tabs[0]!.id} />
        </div>
      </main>
    </>
  );
}
