"use client";

import { Avatar, Button, cx, playerColorStyle, type AccentColor, toast } from "@fellowship/ui";
import type { Role } from "@fellowship/db";
import { useState, useTransition } from "react";
import type { SpaceMemberView } from "@/lib/app/queries";
import { kickMemberAction, setMemberRolesAction } from "@/lib/app/manage-actions";
import styles from "./Settings.module.sass";

/** Membros: dar e tirar cargos (abaixo do seu) e expulsar. */
export function MembersManager({
  spaceId,
  members,
  roles,
  ownerId,
  meId,
  myTop,
  canRoles,
  canKick,
}: {
  spaceId: string;
  members: SpaceMemberView[];
  roles: Role[];
  ownerId: string;
  meId: string;
  myTop: number;
  canRoles: boolean;
  canKick: boolean;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const assignable = roles.filter((r) => !r.is_default).sort((a, b) => b.position - a.position);
  const topOf = (m: SpaceMemberView) =>
    m.user_id === ownerId ? Infinity : Math.max(-1, ...roles.filter((r) => m.roleIds.includes(r.id)).map((r) => r.position));
  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.error) toast.error(r.error);
    });

  const list = members
    .filter((m) => !query || m.profile.display_name.toLowerCase().includes(query.toLowerCase()) || m.profile.username.includes(query.toLowerCase()))
    .sort((a, b) => topOf(b) - topOf(a) || a.profile.display_name.localeCompare(b.profile.display_name, "pt-BR"));

  return (
    <div className={styles.dialogSection}>
      <input
        className={styles.input}
        type="search"
        value={query}
        placeholder="Buscar membro"
        aria-label="Buscar membro"
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className={styles.list}>
        {list.map((m) => {
          const isOwner = m.user_id === ownerId;
          const below = topOf(m) < myTop && m.user_id !== meId;
          return (
            <li key={m.user_id}>
              <div className={styles.personRow}>
                <span className={styles.personLink}>
                  <Avatar name={m.profile.display_name} src={m.profile.avatar_url ?? undefined} color={m.profile.color} size={40} />
                  <span className={styles.personText}>
                    <span className={styles.personName}>
                      {m.profile.display_name}
                      {isOwner && " · dono"}
                    </span>
                    <span className={styles.roleChips}>
                      {assignable
                        .filter((r) => m.roleIds.includes(r.id))
                        .map((r) => (
                          <span key={r.id} className={styles.roleChip} style={r.color ? playerColorStyle(r.color as AccentColor) : undefined}>
                            {r.name}
                          </span>
                        ))}
                    </span>
                  </span>
                </span>
                <span className={styles.personActions}>
                  {canRoles && !isOwner && (
                    <Button variant="ghost" aria-pressed={open === m.user_id} onClick={() => setOpen(open === m.user_id ? null : m.user_id)}>
                      Cargos
                    </Button>
                  )}
                  {canKick &&
                    below &&
                    !isOwner &&
                    (confirm === m.user_id ? (
                      <Button
                        variant="danger"
                        disabled={pending}
                        onClick={() =>
                          run(async () => {
                            const r = await kickMemberAction(spaceId, m.user_id);
                            if (!r.error) toast.success("Membro expulso");
                            return r;
                          })
                        }
                      >
                        Expulsar mesmo
                      </Button>
                    ) : (
                      <Button variant="ghost" onClick={() => setConfirm(m.user_id)}>
                        Expulsar
                      </Button>
                    ))}
                </span>
              </div>
              {open === m.user_id && (
                <div className={cx(styles.managePanel, styles.roleChecks)}>
                  {assignable.map((r) => {
                    const allowed = r.position < myTop;
                    const has = m.roleIds.includes(r.id);
                    return (
                      <label key={r.id} className={styles.switchRow} style={allowed ? undefined : { opacity: 0.5 }}>
                        <input
                          type="checkbox"
                          checked={has}
                          disabled={!allowed || pending}
                          onChange={(e) =>
                            run(() => setMemberRolesAction(spaceId, m.user_id, e.target.checked ? [...m.roleIds, r.id] : m.roleIds.filter((id) => id !== r.id)))
                          }
                        />
                        <span className={styles.label}>{r.name}</span>
                      </label>
                    );
                  })}
                  {assignable.length === 0 && <p className={styles.help}>Crie cargos na aba Cargos.</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
