"use client";

import { BottomSheet, Icon, playerColorStyle, toast, type IconName } from "@fellowship/ui";
import { Permission } from "@fellowship/core";
import type { Space } from "@fellowship/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCategoryAction } from "@/lib/app/manage-actions";
import { usePresenceMap } from "@/lib/presence/PresenceProvider";
import { getBrowserClient } from "@/lib/supabase/client";
import styles from "./SpaceMenu.module.sass";

interface Item {
  icon: IconName;
  label: string;
  hint?: string;
  onSelect?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

/**
 * Menu do Cenário: abre ao tocar no banner e sobe do rodapé na largura da tela.
 * Todos veem convidar, marcar como lido e configurações; o resto aparece conforme as permissões.
 */
export function SpaceMenu({
  space,
  permissions,
  isOwner,
  channelIds,
  memberIds,
  open,
  onClose,
  onInvite,
  onCreateChannel,
}: {
  space: Space;
  permissions: number;
  isOwner: boolean;
  channelIds: string[];
  memberIds: string[];
  open: boolean;
  onClose: () => void;
  onInvite: () => void;
  onCreateChannel: () => void;
}) {
  const router = useRouter();
  const presence = usePresenceMap();
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const has = (bit: number) => (permissions & bit) !== 0;
  const online = memberIds.filter((id) => presence[id] && presence[id] !== "offline").length;
  const then = (fn: () => void) => () => {
    onClose();
    fn();
  };
  const settings = (aba?: string) => then(() => router.push(`/c/${space.id}/configuracoes${aba ? `?aba=${aba}` : ""}`));

  async function markAllRead() {
    const supabase = getBrowserClient();
    await Promise.all(channelIds.map((id) => supabase.rpc("mark_channel_read", { p_channel: id })));
    window.dispatchEvent(new CustomEvent("fellowship:read", { detail: `cenario:${space.id}` }));
    toast.success("Tudo marcado como lido");
    onClose();
    router.refresh();
  }

  const quick: Item[] = [
    has(Permission.CREATE_INVITES)
      ? { icon: "userPlus", label: "Convidar", onSelect: then(onInvite) }
      : { icon: "userPlus", label: "Convidar", disabled: true },
    { icon: "check", label: "Marcar lido", onSelect: () => void markAllRead() },
    { icon: "settings", label: "Configurações", onSelect: settings() },
  ];

  const groups: Item[][] = [
    [
      ...(has(Permission.MANAGE_CHANNELS)
        ? ([
            { icon: "plus", label: "Criar canal", onSelect: then(onCreateChannel) },
            { icon: "menu", label: "Criar categoria", onSelect: () => setNewCategory("") },
          ] as Item[])
        : []),
      ...(has(Permission.CREATE_CAMPAIGNS) ? ([{ icon: "dice", label: "Criar campanha", hint: "Fase 1", disabled: true }] as Item[]) : []),
    ],
    [
      ...(has(Permission.MANAGE_ROLES) ? ([{ icon: "shield", label: "Cargos", onSelect: settings("cargos") }] as Item[]) : []),
      ...(has(Permission.MANAGE_ROLES) || has(Permission.KICK_MEMBERS) ? ([{ icon: "users", label: "Membros", onSelect: settings("membros") }] as Item[]) : []),
      ...(has(Permission.MANAGE_THEME) ? ([{ icon: "gallery", label: "Figurinhas", onSelect: settings("figurinhas") }] as Item[]) : []),
    ],
    isOwner ? [] : ([{ icon: "doorOpen", label: "Sair do Cenário", danger: true, onSelect: settings("sair") }] as Item[]),
  ].filter((g) => g.length);

  return (
    <BottomSheet open={open} onOpenChange={(o) => !o && onClose()} label={`Menu de ${space.name}`}>
      <header className={styles.head}>
        <span
          className={styles.icon}
          style={playerColorStyle(space.color, space.icon_url ? { backgroundImage: `url("${space.icon_url}")`, color: "transparent" } : undefined)}
          aria-hidden="true"
        >
          {space.short}
        </span>
        <h2 className={styles.name}>{space.name}</h2>
        <p className={styles.stats}>
          <span className={styles.dotOnline} aria-hidden="true" /> {online} online
          <span className={styles.dotMembers} aria-hidden="true" /> {memberIds.length} {memberIds.length === 1 ? "membro" : "membros"}
        </p>
      </header>

      <div className={styles.quick}>
        {quick.map((q) => (
          <button key={q.label} type="button" className={styles.quickItem} disabled={q.disabled} onClick={q.onSelect}>
            <span className={styles.quickIcon}>
              <Icon name={q.icon} size={22} />
            </span>
            {q.label}
          </button>
        ))}
      </div>

      {groups.map((items, i) => (
        <ul key={i} className={styles.group}>
          {items.map((it) => (
            <li key={it.label}>
              <button type="button" className={`${styles.item} ${it.danger ? styles.danger : ""}`} disabled={it.disabled} onClick={it.onSelect}>
                <Icon name={it.icon} size={18} />
                <span className={styles.itemLabel}>{it.label}</span>
                {it.hint && <span className={styles.hint}>{it.hint}</span>}
              </button>
              {it.label === "Criar categoria" && newCategory !== null && (
                <form
                  className={styles.inline}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newCategory.trim()) return setNewCategory(null);
                    const r = await createCategoryAction(space.id, newCategory);
                    if (r.error) toast.error(r.error);
                    else {
                      toast.success("Categoria criada");
                      onClose();
                    }
                    setNewCategory(null);
                  }}
                >
                  <input autoFocus value={newCategory} maxLength={40} placeholder="Nome da categoria" aria-label="Nome da nova categoria" onChange={(e) => setNewCategory(e.target.value)} />
                </form>
              )}
            </li>
          ))}
        </ul>
      ))}
    </BottomSheet>
  );
}
