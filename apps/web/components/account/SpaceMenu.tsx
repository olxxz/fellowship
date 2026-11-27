"use client";

import { Icon, IconButton, toast, type IconName } from "@fellowship/ui";
import { Permission } from "@fellowship/core";
import type { Space } from "@fellowship/db";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "@/components/shell/Sidebar.module.sass";
import { createCategoryAction } from "@/lib/app/manage-actions";
import { getBrowserClient } from "@/lib/supabase/client";

interface Item {
  icon: IconName;
  label: string;
  hint?: string;
  onSelect?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

/**
 * Menu do Cenário: abre ao tocar no banner e sobe de baixo para cima, cobrindo a barra.
 * Todos veem convidar e configurações; o resto aparece conforme as permissões.
 */
export function SpaceMenu({
  space,
  permissions,
  isOwner,
  channelIds,
  open,
  onClose,
  onInvite,
  onCreateChannel,
}: {
  space: Space;
  permissions: number;
  isOwner: boolean;
  channelIds: string[];
  open: boolean;
  onClose: () => void;
  onInvite: () => void;
  onCreateChannel: () => void;
}) {
  const router = useRouter();
  const first = useRef<HTMLButtonElement>(null);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const has = (bit: number) => (permissions & bit) !== 0;
  const settings = (aba?: string) => () => {
    onClose();
    router.push(`/c/${space.id}/configuracoes${aba ? `?aba=${aba}` : ""}`);
  };

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function markAllRead() {
    const supabase = getBrowserClient();
    await Promise.all(channelIds.map((id) => supabase.rpc("mark_channel_read", { p_channel: id })));
    window.dispatchEvent(new CustomEvent("fellowship:read", { detail: `cenario:${space.id}` }));
    toast.success("Tudo marcado como lido");
    onClose();
    router.refresh();
  }

  const inviteItem: Item = has(Permission.CREATE_INVITES)
    ? { icon: "userPlus", label: "Convidar pessoas", onSelect: () => {
          onClose();
          onInvite();
        } }
    : { icon: "userPlus", label: "Convidar pessoas", disabled: true, hint: "Seu cargo não cria convites" };
  const sections: Item[][] = ([
    [
      inviteItem,
      { icon: "check", label: "Marcar tudo como lido", onSelect: () => void markAllRead() },
    ],
    [
      ...(has(Permission.MANAGE_CHANNELS)
        ? ([
            { icon: "plus", label: "Criar canal", onSelect: () => {
                onClose();
                onCreateChannel();
              } },
            { icon: "menu", label: "Criar categoria", onSelect: () => setNewCategory("") },
          ] as Item[])
        : []),
      ...(has(Permission.CREATE_CAMPAIGNS) ? ([{ icon: "dice", label: "Criar campanha", hint: "Chega na fase 1", disabled: true }] as Item[]) : []),
    ],
    [
      { icon: "settings", label: "Configurações do Cenário", onSelect: settings() },
      ...(has(Permission.MANAGE_ROLES) ? ([{ icon: "shield", label: "Cargos", onSelect: settings("cargos") }] as Item[]) : []),
      ...(has(Permission.MANAGE_ROLES) || has(Permission.KICK_MEMBERS) ? ([{ icon: "users", label: "Membros", onSelect: settings("membros") }] as Item[]) : []),
      ...(has(Permission.MANAGE_THEME) ? ([{ icon: "gallery", label: "Figurinhas", onSelect: settings("figurinhas") }] as Item[]) : []),
    ],
    isOwner ? [] : [{ icon: "leave", label: "Sair do Cenário", danger: true, onSelect: settings("sair") }],
  ] as Item[][]).filter((s) => s.length);

  let firstAssigned = false;
  return (
    <div className={`${styles.spaceMenu} ${open ? styles.spaceMenuOpen : ""}`} role="dialog" aria-modal="false" aria-label={`Menu de ${space.name}`} inert={!open}>
      <div className={styles.spaceMenuHeader}>
        <span className={styles.spaceMenuName}>{space.name}</span>
        <IconButton icon="close" label="Fechar menu" variant="ghost" onClick={onClose} />
      </div>
      <div className={styles.spaceMenuBody}>
        {sections.map((items, i) => (
          <ul key={i} className={styles.spaceMenuGroup}>
            {items.map((it) => {
              const ref = !firstAssigned && !it.disabled ? ((firstAssigned = true), first) : undefined;
              return (
                <li key={it.label}>
                  <button ref={ref} type="button" className={`${styles.spaceMenuItem} ${it.danger ? styles.spaceMenuDanger : ""}`} disabled={it.disabled} onClick={it.onSelect}>
                    <Icon name={it.icon} size={18} />
                    <span>
                      {it.label}
                      {it.hint && <small>{it.hint}</small>}
                    </span>
                  </button>
                  {it.label === "Criar categoria" && newCategory !== null && (
                    <form
                      className={styles.newCategory}
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
              );
            })}
          </ul>
        ))}
      </div>
    </div>
  );
}
