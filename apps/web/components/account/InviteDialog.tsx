"use client";

import { Button, Modal, SkeletonText } from "@fellowship/ui";
import type { Invite } from "@fellowship/db";
import { useEffect, useState, useTransition } from "react";
import { createInviteAction, listInvitesAction } from "@/lib/app/space-actions";
import { inviteLink, InviteRow } from "./InviteRow";
import styles from "./Settings.module.sass";

const EXPIRES: Array<[string, number | null]> = [
  ["1 hora", 1],
  ["1 dia", 24],
  ["7 dias", 168],
  ["30 dias", 720],
  ["Nunca", null],
];
const USES: Array<[string, number | null]> = [
  ["Sem limite", null],
  ["1 pessoa", 1],
  ["5 pessoas", 5],
  ["10 pessoas", 10],
  ["25 pessoas", 25],
];

/**
 * Convidar: primeiro os convites ativos, prontos para copiar; abaixo, criar um novo
 * (validade e limite de usos), que já entra na lista com o link copiado.
 */
export function InviteDialog({ spaceId, spaceName, open, onOpenChange }: { spaceId: string; spaceName: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [expires, setExpires] = useState("2");
  const [uses, setUses] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let alive = true;
    listInvitesAction(spaceId)
      .then((list) => alive && setInvites(list))
      .catch(() => alive && setInvites([]));
    return () => {
      alive = false;
    };
  }, [open, spaceId]);

  function create() {
    setError(null);
    startTransition(async () => {
      const result = await createInviteAction(spaceId, EXPIRES[Number(expires)]![1], USES[Number(uses)]![1]);
      if (!("code" in result) || !result.code) {
        setError(result.error ?? "Não foi possível criar o convite agora.");
        return;
      }
      const code = result.code;
      const copied = await navigator.clipboard.writeText(inviteLink(code)).then(
        () => true,
        () => false,
      );
      setFresh(copied ? code : null);
      setInvites(await listInvitesAction(spaceId));
    });
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setFresh(null);
          setError(null);
          setInvites(null);
        }
      }}
      title={`Convidar para ${spaceName}`}
      description="Quem abrir o link entra no Cenário como Membro, depois de entrar na conta."
    >
      <section className={styles.dialogSection} aria-label="Convites ativos">
        <h3 className={styles.label}>Convites ativos</h3>
        {invites === null ? (
          <SkeletonText lines={2} lineHeight={14} />
        ) : invites.length === 0 ? (
          <p className={styles.help}>Nenhum convite ativo. Crie um abaixo.</p>
        ) : (
          <ul className={styles.list}>
            {invites.map((invite) => (
              <InviteRow key={invite.code} invite={invite} copiedInitially={invite.code === fresh} />
            ))}
          </ul>
        )}
      </section>

      <section className={styles.dialogSection} aria-label="Novo convite">
        <h3 className={styles.label}>Novo convite</h3>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.help}>Vale por</span>
            <select className={styles.input} value={expires} onChange={(e) => setExpires(e.target.value)}>
              {EXPIRES.map(([label], i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.help}>Usos</span>
            <select className={styles.input} value={uses} onChange={(e) => setUses(e.target.value)}>
              {USES.map(([label], i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Button variant={invites && invites.length > 0 ? "secondary" : "primary"} icon="link" onClick={create} loading={pending} loadingLabel="Criando…">
          Criar e copiar link
        </Button>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </section>
    </Modal>
  );
}
