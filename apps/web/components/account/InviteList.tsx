"use client";

import { Button, toast } from "@fellowship/ui";
import type { Invite } from "@fellowship/db";
import { useState, useTransition } from "react";
import { revokeInviteAction } from "@/lib/app/space-actions";
import { InviteDialog } from "./InviteDialog";
import { InviteRow } from "./InviteRow";
import styles from "./Settings.module.sass";

/** Convites ativos do Cenário nas configurações (já filtrados no servidor): copiar ou revogar. Cada um vê os que criou; quem gerencia canais vê todos. */
export function InviteList({ spaceId, spaceName, invites, canInvite }: { spaceId: string; spaceName: string; invites: Invite[]; canInvite: boolean }) {
  const [open, setOpen] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const active = invites;

  return (
    <>
      {active.length === 0 ? (
        <p className={styles.help}>Nenhum convite ativo.</p>
      ) : (
        <ul className={styles.list}>
          {active.map((invite) => (
            <InviteRow
              key={invite.code}
              invite={invite}
              revoking={revoking === invite.code}
              onRevoke={() => {
                setRevoking(invite.code);
                startTransition(async () => {
                  const result = await revokeInviteAction(spaceId, invite.code);
                  if (result.error) toast.error(result.error);
                  setRevoking(null);
                });
              }}
            />
          ))}
        </ul>
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
