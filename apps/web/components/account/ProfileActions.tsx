"use client";

import { Button, ButtonLink } from "@fellowship/ui";
import type { FriendshipState } from "@fellowship/db";
import Link from "next/link";
import { useState, useTransition } from "react";
import { removeFriendAction, requestFriendAction, respondFriendAction } from "@/lib/app/social-actions";
import { dmHref } from "@/lib/routes";

/** Botões do perfil de outra pessoa, conforme a amizade. */
export function ProfileActions({ id, username, initial }: { id: string; username: string; initial: FriendshipState }) {
  const [state, setState] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<FriendshipState | { error?: string }>, next?: FriendshipState) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (typeof r === "string") setState(r);
      else if (r.error) setError(r.error);
      else if (next) setState(next);
    });

  return (
    <>
      {state === "amigos" && (
        <>
          <ButtonLink href={dmHref(username)} linkAs={Link} variant="primary" icon="chat">
            Mensagem
          </ButtonLink>
          <Button loading={pending} onClick={() => run(() => removeFriendAction(id), "nenhuma")}>
            Desfazer amizade
          </Button>
        </>
      )}
      {state === "nenhuma" && (
        <Button
          variant="primary"
          icon="userPlus"
          loading={pending}
          loadingLabel="Enviando…"
          onClick={() => run(async () => ((r) => r.state ?? { error: r.error })(await requestFriendAction(username)))}
        >
          Adicionar amigo
        </Button>
      )}
      {state === "enviado" && (
        <Button loading={pending} onClick={() => run(() => removeFriendAction(id), "nenhuma")}>
          Pedido enviado · cancelar
        </Button>
      )}
      {state === "recebido" && (
        <>
          <Button variant="primary" icon="check" loading={pending} onClick={() => run(() => respondFriendAction(id, true), "amigos")}>
            Aceitar pedido
          </Button>
          <Button disabled={pending} onClick={() => run(() => respondFriendAction(id, false), "nenhuma")}>
            Recusar
          </Button>
        </>
      )}
      {error && (
        <p role="alert" style={{ flexBasis: "100%", color: "var(--danger)", fontSize: 13 }}>
          {error}
        </p>
      )}
    </>
  );
}
