"use client";

import { Button, Icon, Modal } from "@fellowship/ui";
import { useState, useTransition } from "react";
import { createInviteAction } from "@/lib/app/space-actions";
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

/** Gera um link de convite para o Cenário, com validade e limite de usos, e copia ou compartilha. */
export function InviteDialog({ spaceId, spaceName, open, onOpenChange }: { spaceId: string; spaceName: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [expires, setExpires] = useState("2");
  const [uses, setUses] = useState("0");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function generate() {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const result = await createInviteAction(spaceId, EXPIRES[Number(expires)]![1], USES[Number(uses)]![1]);
      if ("code" in result && result.code) setLink(`${window.location.origin}/convite/${result.code}`);
      else setError(result.error ?? "Não foi possível criar o convite agora.");
    });
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setError("Não deu para copiar. Selecione o link e copie à mão.");
    }
  }

  async function share() {
    if (link && navigator.share) await navigator.share({ title: `Convite para ${spaceName}`, url: link }).catch(() => undefined);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setLink(null);
          setCopied(false);
        }
      }}
      title={`Convidar para ${spaceName}`}
      description="Quem abrir o link entra no Cenário como Membro, depois de entrar na conta."
    >
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Vale por</span>
          <select className={styles.input} value={expires} onChange={(e) => setExpires(e.target.value)}>
            {EXPIRES.map(([label], i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Usos</span>
          <select className={styles.input} value={uses} onChange={(e) => setUses(e.target.value)}>
            {USES.map(([label], i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {link ? (
        <>
          <div className={styles.linkBox}>
            <Icon name="link" size={16} />
            <input className={styles.linkInput} readOnly value={link} aria-label="Link do convite" onFocus={(e) => e.currentTarget.select()} />
          </div>
          <div className={styles.actions}>
            <Button variant="primary" icon={copied ? "check" : "copy"} onClick={() => void copy()}>
              {copied ? "Copiado" : "Copiar link"}
            </Button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <Button onClick={() => void share()}>Compartilhar</Button>
            )}
            <Button onClick={generate} loading={pending}>
              Gerar outro
            </Button>
          </div>
          <span className={styles.srOnly} role="status">
            {copied ? "Link copiado" : ""}
          </span>
        </>
      ) : (
        <Button variant="primary" icon="link" onClick={generate} loading={pending}>
          Gerar link de convite
        </Button>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
