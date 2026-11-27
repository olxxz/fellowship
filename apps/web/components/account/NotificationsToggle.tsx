"use client";

import { Button } from "@fellowship/ui";
import { useEffect, useState, useSyncExternalStore } from "react";
import { currentSubscription, disablePush, enablePush, pushSupport, type PushSupport } from "@/lib/push";
import styles from "./Settings.module.sass";

const TEXT: Record<Exclude<PushSupport, "ok">, string> = {
  "sem-chave": "As notificações ainda não estão configuradas no servidor.",
  "sem-suporte": "Este navegador não recebe notificações.",
  instalar: "No iPhone, as notificações só funcionam com o app instalado: no Safari, Compartilhar → Adicionar à Tela de Início, e ative por lá.",
};

const noop = () => () => {};

/** Liga ou desliga as notificações neste aparelho (menções e conversas diretas). */
export function NotificationsToggle() {
  const support = useSyncExternalStore(noop, pushSupport, () => null);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (support === "ok") void currentSubscription().then((sub) => setOn(!!sub && Notification.permission === "granted"));
  }, [support]);

  if (support === null) return null;
  if (support !== "ok") return <p className={styles.help}>{TEXT[support]}</p>;

  return (
    <div className={styles.dialogSection}>
      <p className={styles.help}>Avisa neste aparelho quando alguém mencionar você (@) ou mandar mensagem direta.</p>
      <div className={styles.actions}>
        <Button
          variant={on ? "secondary" : "primary"}
          icon={on ? "close" : "check"}
          loading={busy}
          loadingLabel={on ? "Desligando…" : "Ligando…"}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              if (on) await disablePush();
              else await enablePush();
              setOn(!on);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Não foi possível agora.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {on ? "Desligar notificações neste aparelho" : "Ligar notificações neste aparelho"}
        </Button>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
