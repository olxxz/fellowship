"use client";

import { Button } from "@fellowship/ui";
import { useState, useTransition } from "react";
import { deleteSpaceAction, leaveSpaceAction } from "@/lib/app/manage-actions";
import styles from "./Settings.module.sass";

/** Sair do Cenário (membros) ou apagar o Cenário (dono, confirmando o nome). */
export function DangerZone({ spaceId, spaceName, isOwner }: { spaceId: string; spaceName: string; isOwner: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [typed, setTyped] = useState("");
  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r?.error) setError(r.error);
    });

  return (
    <div className={styles.dialogSection}>
      {isOwner ? (
        <>
          <p className={styles.help}>Apagar o Cenário apaga canais, mensagens, cargos e convites para todo mundo. Não tem volta.</p>
          {confirm ? (
            <div className={styles.inlineForm}>
              <input className={styles.input} value={typed} placeholder={`Digite ${spaceName}`} aria-label="Confirme o nome do Cenário" onChange={(e) => setTyped(e.target.value)} />
              <Button variant="danger" icon="trash" loading={pending} disabled={typed.trim() !== spaceName} onClick={() => run(() => deleteSpaceAction(spaceId, typed))}>
                Apagar para sempre
              </Button>
            </div>
          ) : (
            <Button variant="danger" icon="trash" onClick={() => setConfirm(true)}>
              Apagar o Cenário
            </Button>
          )}
        </>
      ) : (
        <>
          <p className={styles.help}>Você sai do Cenário e deixa de ver os canais. Para voltar, precisa de um convite (ou, se for público, de Explorar).</p>
          {confirm ? (
            <Button variant="danger" icon="leave" loading={pending} onClick={() => run(() => leaveSpaceAction(spaceId))}>
              Sair mesmo
            </Button>
          ) : (
            <Button variant="danger" icon="leave" onClick={() => setConfirm(true)}>
              Sair do Cenário
            </Button>
          )}
        </>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
