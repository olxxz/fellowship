"use client";

import { Button, cx, IconButton, playerColorStyle, type AccentColor } from "@fellowship/ui";
import type { Role } from "@fellowship/db";
import { useState, useTransition } from "react";
import { createRoleAction, deleteRoleAction, reorderRolesAction, updateRoleAction } from "@/lib/app/manage-actions";
import { Permission, PERMISSION_LABELS } from "@/lib/app/permission-labels";
import styles from "./Settings.module.sass";

const COLORS = [null, 1, 2, 3, 4, 5, 6] as const;

/**
 * Cargos, de cima (mais forte) para baixo. Só dá para mexer nos que estão abaixo do seu cargo mais alto
 * e só dar permissões que você tem (o banco confere de novo).
 */
export function RolesManager({ spaceId, roles, memberCounts, myTop, myPerms }: { spaceId: string; roles: Role[]; memberCounts: Record<string, number>; myTop: number; myPerms: number }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r.error) setError(r.error);
    });

  const ordered = roles.filter((r) => !r.is_default).sort((a, b) => b.position - a.position);
  const everyone = roles.find((r) => r.is_default);
  const editable = (r: Role) => r.is_default || r.position < myTop;
  const moveRole = (i: number, d: number) => {
    const next = [...ordered];
    const [item] = next.splice(i, 1);
    next.splice(i + d, 0, item!);
    run(() => reorderRolesAction(spaceId, next.map((r) => r.id)));
  };

  return (
    <div className={styles.dialogSection}>
      <div className={styles.actions}>
        <Button icon="plus" loading={pending} loadingLabel="Criando…" onClick={() => run(() => createRoleAction(spaceId, "Novo cargo", null, Permission.VIEW_CHANNEL | Permission.SEND_MESSAGES | Permission.SPEAK))}>
          Criar cargo
        </Button>
        <span className={styles.help}>O cargo novo entra embaixo. Suba com as setas: quem tem cargo mais alto manda nos de baixo.</span>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <ul className={styles.list}>
        {[...ordered, ...(everyone ? [everyone] : [])].map((r, i) => (
          <li key={r.id}>
            <div className={styles.manageRow}>
              <span className={styles.roleDot} style={r.color ? playerColorStyle(r.color as AccentColor) : undefined} aria-hidden="true" />
              <span className={styles.personText}>
                <span className={styles.personName}>{r.is_default ? "@todos" : r.name}</span>
                <span className={styles.help}>{r.is_default ? "Vale para todos os membros" : `${memberCounts[r.id] ?? 0} ${(memberCounts[r.id] ?? 0) === 1 ? "membro" : "membros"}${r.granted_on_join ? " · dado ao entrar" : ""}`}</span>
              </span>
              <span className={styles.personActions}>
                {!r.is_default && (
                  <>
                    <IconButton icon="chevronDown" label={`Subir ${r.name}`} variant="ghost" className={styles.flipUp} disabled={pending || i === 0 || !editable(r) || !editable(ordered[i - 1]!)} onClick={() => moveRole(i, -1)} />
                    <IconButton icon="chevronDown" label={`Descer ${r.name}`} variant="ghost" disabled={pending || i === ordered.length - 1 || !editable(r)} onClick={() => moveRole(i, 1)} />
                  </>
                )}
                <IconButton icon={editable(r) ? "pencil" : "lock"} label={editable(r) ? `Editar ${r.name}` : `${r.name}: acima do seu cargo`} variant="ghost" disabled={!editable(r)} aria-pressed={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)} />
              </span>
            </div>
            {open === r.id && editable(r) && (
              <RoleEdit
                role={r}
                myPerms={myPerms}
                busy={pending}
                onSave={(name, color, perms, join) =>
                  run(async () => {
                    const result = await updateRoleAction(spaceId, r.id, name, color, perms, join);
                    if (!result.error) setOpen(null);
                    return result;
                  })
                }
                onDelete={() =>
                  run(async () => {
                    const result = await deleteRoleAction(spaceId, r.id);
                    if (!result.error) setOpen(null);
                    return result;
                  })
                }
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleEdit({ role, myPerms, busy, onSave, onDelete }: { role: Role; myPerms: number; busy: boolean; onSave: (name: string, color: number | null, perms: number, join: boolean) => void; onDelete: () => void }) {
  const [name, setName] = useState(role.name);
  const [color, setColor] = useState<number | null>(role.color);
  const [perms, setPerms] = useState(role.permissions);
  const [join, setJoin] = useState(role.granted_on_join);
  const [confirm, setConfirm] = useState(false);
  return (
    <form
      className={cx(styles.managePanel, styles.dialogSection)}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(name, color, perms, join);
      }}
    >
      {!role.is_default && (
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Nome</span>
            <input className={styles.input} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className={styles.field}>
            <span className={styles.label}>Cor</span>
            <span className={styles.swatches} role="radiogroup" aria-label="Cor do cargo">
              {COLORS.map((c) => (
                <button key={String(c)} type="button" role="radio" aria-checked={color === c} aria-label={c ? `Cor ${c}` : "Sem cor"} className={styles.swatch} style={c ? playerColorStyle(c as AccentColor) : undefined} onClick={() => setColor(c)} />
              ))}
            </span>
          </div>
        </div>
      )}
      <fieldset className={styles.kinds}>
        <legend className={styles.label}>Permissões</legend>
        {PERMISSION_LABELS.map((p) => {
          const bit = Permission[p.key];
          const mine = (myPerms & bit) !== 0;
          return (
            <label key={p.key} className={styles.switchRow} style={mine ? undefined : { opacity: 0.5 }}>
              <input type="checkbox" checked={(perms & bit) !== 0} disabled={!mine} onChange={(e) => setPerms(e.target.checked ? perms | bit : perms & ~bit)} />
              <span className={styles.field}>
                <span className={styles.label}>{p.label}</span>
                <span className={styles.help}>{mine ? p.help : "Você não tem esta permissão, então não pode dar."}</span>
              </span>
            </label>
          );
        })}
      </fieldset>
      {!role.is_default && (
        <label className={styles.switchRow}>
          <input type="checkbox" checked={join} onChange={(e) => setJoin(e.target.checked)} />
          <span className={styles.field}>
            <span className={styles.label}>Dar ao entrar</span>
            <span className={styles.help}>Quem entrar por convite ou em Explorar já recebe este cargo.</span>
          </span>
        </label>
      )}
      <div className={styles.actions}>
        <Button type="submit" variant="primary" loading={busy} loadingLabel="Salvando…">
          Salvar cargo
        </Button>
        {!role.is_default &&
          (confirm ? (
            <Button variant="danger" icon="trash" onClick={onDelete}>
              Apagar de vez
            </Button>
          ) : (
            <Button variant="ghost" icon="trash" onClick={() => setConfirm(true)}>
              Apagar cargo
            </Button>
          ))}
      </div>
    </form>
  );
}
