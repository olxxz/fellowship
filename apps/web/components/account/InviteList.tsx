"use client";

import { Button } from "@fellowship/ui";
import type { Invite } from "@fellowship/db";
import { useState, useTransition } from "react";
import { revokeInviteAction } from "@/lib/app/space-actions";
import { InviteDialog } from "./InviteDialog";
import styles from "./Settings.module.sass";

function describe(invite: Invite) {
  const parts = [`${invite.uses}${invite.max_uses ? ` de ${invite.max_uses}` : ""} usos`];
  if (invite.expires_at) {
    const date = new Date(invite.expires_at);
    parts.push(date < new Date() ? "expirado" : `vale até ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date)}`);
  } else parts.push("não expira");
  return parts.join(" · ");
}

/** Convites ativos do Cenário: cada um vê os que criou; quem gerencia canais vê todos. */
export function InviteList({ spaceId, spaceName, invites, canInvite }: { spaceId: string; spaceName: string; invites: Invite[]; canInvite: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const active = invites.filter((i) => !i.revoked_at);

  return (
    <>
      {active.length === 0 ? (
        <p className={styles.help}>Nenhum convite ativo.</p>
      ) : (
        <ul className={styles.list}>
          {active.map((invite) => (
            <li key={invite.code} className={styles.invite}>
              <span className={styles.inviteCode}>{invite.code}</span>
              <span className={styles.inviteMeta}>{describe(invite)}</span>
              <Button
                variant="danger"
                loading={pending}
                loadingLabel="Revogando…"
                onClick={() =>
                  startTransition(async () => {
                    const result = await revokeInviteAction(spaceId, invite.code);
                    setError(result.error ?? null);
                  })
                }
              >
                Revogar
              </Button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {canInvite && (
        <div className={styles.actions}>
          <Button icon="userPlus" onClick={() => setOpen(true)}>
            Novo convite
          </Button>
        </div>
      )}
      {canInvite && <InviteDialog spaceId={spaceId} spaceName={spaceName} open={open} onOpenChange={setOpen} />}
    </>
  );
}
