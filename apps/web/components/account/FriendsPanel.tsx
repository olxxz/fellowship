"use client";

import { Avatar, Button, ButtonLink, IconButton } from "@fellowship/ui";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { FriendProfile } from "@/lib/app/queries";
import { removeFriendAction, requestFriendAction, respondFriendAction } from "@/lib/app/social-actions";
import { dmHref, friendLinkHref, userHref } from "@/lib/routes";
import { publicOrigin } from "@/lib/site";
import styles from "./Settings.module.sass";

const STATE_TEXT: Record<string, string> = {
  enviado: "Pedido enviado. Quando aceitarem, vocês viram amigos.",
  amigos: "Pronto, vocês são amigos.",
};

function Person({ p, children }: { p: FriendProfile; children?: React.ReactNode }) {
  return (
    <li className={styles.personRow}>
      <Link href={userHref(p.username)} className={styles.personLink}>
        <Avatar name={p.display_name} src={p.avatar_url ?? undefined} color={p.color} size={40} />
        <span className={styles.personText}>
          <span className={styles.personName}>{p.display_name}</span>
          <span className={styles.help}>@{p.username}</span>
        </span>
      </Link>
      <span className={styles.personActions}>{children}</span>
    </li>
  );
}

export function FriendsPanel({
  me,
  friends,
  incoming,
  outgoing,
}: {
  me: { username: string };
  friends: FriendProfile[];
  incoming: FriendProfile[];
  outgoing: FriendProfile[];
}) {
  const [nick, setNick] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const [busy, startBusy] = useTransition();
  const link = `${publicOrigin()}${friendLinkHref(me.username)}`;

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!nick.trim()) return;
    start(async () => {
      const result = await requestFriendAction(nick);
      if (result.error) setMessage({ ok: false, text: result.error });
      else {
        setMessage({ ok: true, text: STATE_TEXT[result.state!] ?? "Feito." });
        setNick("");
      }
    });
  }

  return (
    <>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Adicionar amigo</h3>
        <form className={styles.inlineForm} onSubmit={add}>
          <span className={styles.nickInput}>
            <span aria-hidden="true">@</span>
            <input
              className={styles.input}
              value={nick}
              onChange={(e) => setNick(e.target.value.toLowerCase())}
              placeholder="nick do seu amigo"
              aria-label="Nick do amigo"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={21}
            />
          </span>
          <Button type="submit" variant="primary" icon="userPlus" loading={pending} loadingLabel="Enviando…">
            Enviar pedido
          </Button>
        </form>
        {message && (
          <p className={message.ok ? styles.saved : styles.error} role={message.ok ? "status" : "alert"}>
            {message.text}
          </p>
        )}
        <p className={styles.help}>
          Seu nick é <strong>@{me.username}</strong>. Pode trocar em <Link href="/conta">Editar perfil</Link>.
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Seu link de convite</h3>
        <p className={styles.help}>Quem abrir cria a conta (se ainda não tiver) e já manda pedido de amizade para você.</p>
        <div className={styles.linkBox}>
          <input className={styles.input} readOnly value={link} aria-label="Seu link de convite" onFocus={(e) => e.target.select()} />
          <Button
            icon={copied ? "check" : "copy"}
            onClick={() =>
              void navigator.clipboard.writeText(link).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              })
            }
          >
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
      </section>

      {incoming.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Pedidos recebidos — {incoming.length}</h3>
          <ul className={styles.list}>
            {incoming.map((p) => (
              <Person key={p.id} p={p}>
                <Button variant="primary" icon="check" disabled={busy} onClick={() => startBusy(() => void respondFriendAction(p.id, true))}>
                  Aceitar
                </Button>
                <IconButton icon="close" label={`Recusar ${p.display_name}`} disabled={busy} onClick={() => startBusy(() => void respondFriendAction(p.id, false))} />
              </Person>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Amigos — {friends.length}</h3>
        {friends.length === 0 ? (
          <p className={styles.help}>Nenhum amigo ainda. Mande seu link para o grupo.</p>
        ) : (
          <ul className={styles.list}>
            {friends.map((p) => (
              <Person key={p.id} p={p}>
                <ButtonLink href={dmHref(p.username)} linkAs={Link} icon="chat">
                  Mensagem
                </ButtonLink>
                <IconButton icon="close" label={`Desfazer amizade com ${p.display_name}`} disabled={busy} onClick={() => startBusy(() => void removeFriendAction(p.id))} />
              </Person>
            ))}
          </ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Pedidos enviados — {outgoing.length}</h3>
          <ul className={styles.list}>
            {outgoing.map((p) => (
              <Person key={p.id} p={p}>
                <Button disabled={busy} onClick={() => startBusy(() => void removeFriendAction(p.id))}>
                  Cancelar
                </Button>
              </Person>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
