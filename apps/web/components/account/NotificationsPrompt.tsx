"use client";

import { Button, IconButton, toast } from "@fellowship/ui";
import { useEffect, useState, useSyncExternalStore } from "react";
import { currentSubscription, enablePush, pushSupport } from "@/lib/push";
import { useFlag } from "@/lib/prefs";
import styles from "./NotificationsPrompt.module.sass";

const noop = () => () => {};

/**
 * Convite para ligar as notificações neste aparelho, no Início (aparece logo depois de criar a conta).
 * Some quando liga, quando a pessoa dispensa ou se o navegador já bloqueou. No iPhone sem o app instalado,
 * explica como instalar.
 */
export function NotificationsPrompt() {
  const support = useSyncExternalStore(noop, pushSupport, () => null);
  const [dismissed, setDismissed] = useFlag("aviso-notificacoes", false);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (support === "ok") void currentSubscription().then((s) => setSubscribed(!!s && Notification.permission === "granted"));
  }, [support]);

  if (dismissed || support === null || support === "sem-chave" || support === "sem-suporte") return null;
  if (support === "ok" && (subscribed !== false || Notification.permission === "denied")) return null;

  return (
    <aside className={styles.card} aria-label="Notificações">
      <div className={styles.text}>
        <strong>Não perca a sessão</strong>
        <span>
          {support === "instalar"
            ? "No iPhone, os avisos só chegam com o app instalado: no Safari, Compartilhar → Adicionar à Tela de Início. Depois ligue por aqui."
            : "Ligue as notificações para saber quando alguém te mencionar ou mandar mensagem."}
        </span>
      </div>
      {support === "ok" && (
        <Button
          variant="primary"
          icon="check"
          loading={busy}
          loadingLabel="Ligando…"
          onClick={async () => {
            setBusy(true);
            try {
              await enablePush();
              setSubscribed(true);
              toast.success("Notificações ligadas neste aparelho");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Não foi possível agora.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Ligar notificações
        </Button>
      )}
      <IconButton icon="close" variant="ghost" label="Agora não" onClick={() => setDismissed(true)} />
    </aside>
  );
}
