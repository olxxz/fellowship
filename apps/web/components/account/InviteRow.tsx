"use client";

import { Button, IconButton, toast } from "@fellowship/ui";
import type { Invite } from "@fellowship/db";
import { useState } from "react";
import { publicOrigin } from "@/lib/site";
import styles from "./Settings.module.sass";

export const inviteLink = (code: string) => `${publicOrigin()}/convite/${code}`;

export function describeInvite(invite: Invite) {
  const uses = invite.max_uses ? `${invite.uses} de ${invite.max_uses} usos` : `${invite.uses} ${invite.uses === 1 ? "uso" : "usos"}`;
  if (!invite.expires_at) return `${uses} · não expira`;
  const date = new Date(invite.expires_at);
  if (date < new Date()) return `${uses} · expirado`;
  return `${uses} · vale até ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date)}`;
}

/** Um convite: código, usos e validade, com copiar (e compartilhar, no celular) e, se couber, revogar. */
export function InviteRow({ invite, copiedInitially, onRevoke, revoking }: { invite: Invite; copiedInitially?: boolean; onRevoke?: () => void; revoking?: boolean }) {
  const [copied, setCopied] = useState(!!copiedInitially);
  const [failed, setFailed] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteLink(invite.code));
      setCopied(true);
      toast.success("Link do convite copiado");
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  return (
    <li className={styles.invite}>
      <div className={styles.inviteText}>
        <span className={styles.inviteCode}>{invite.code}</span>
        <span className={styles.inviteMeta}>{failed ? "Não deu para copiar. Toque e segure o código para copiar à mão." : describeInvite(invite)}</span>
      </div>
      <div className={styles.inviteActions}>
        <Button variant={copied ? "secondary" : "primary"} icon={copied ? "check" : "copy"} iconMotion={copied ? "pop" : undefined} onClick={() => void copy()}>
          {copied ? "Copiado" : "Copiar link"}
        </Button>
        {canShare && (
          <IconButton icon="link" label="Compartilhar link" onClick={() => void navigator.share({ url: inviteLink(invite.code) }).catch(() => undefined)} />
        )}
        {onRevoke && (
          <Button loading={revoking} loadingLabel="Revogando…" onClick={onRevoke}>
            Revogar
          </Button>
        )}
      </div>
      <span className={styles.srOnly} role="status">
        {copied ? "Link copiado" : ""}
      </span>
    </li>
  );
}
