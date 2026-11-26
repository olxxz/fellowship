"use client";

import { cx, Icon } from "@fellowship/ui";
import { useEffect, useRef } from "react";
import { useDemo } from "@/lib/demo/store";
import styles from "./Chat.module.sass";
import { Composer, type ChatMode } from "./Composer";
import { MessageList } from "./MessageList";

export interface ChatViewProps {
  channelKey: string;
  mode: ChatMode;
  /** Nome do canal, para o rótulo do registro e a introdução. */
  name: string;
  intro?: string;
  /** Só o mestre escreve (ex.: Anúncios). */
  masterOnly?: boolean;
  /** Esconde a introdução no topo (painel estreito da Mesa). */
  compact?: boolean;
}

/** Chat de um canal: registro de mensagens, envio otimista e comando de dados. */
export function ChatView({ channelKey, mode, name, intro, masterOnly, compact }: ChatViewProps) {
  const { messages, viewer, me, myCharacter } = useDemo();
  const master = viewer === "mestre";
  const logRef = useRef<HTMLOListElement>(null);

  let list = messages[channelKey] ?? [];
  // Sem metagame: sussurros só aparecem para quem participa deles e para o mestre.
  if (mode === "sussurro" && !master) {
    list = list.filter((m) => m.type === "text" && (m.authorId === me.id || m.whisperTo === myCharacter.name));
  }

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [list.length]);

  const canWrite = !masterOnly || master;

  return (
    <div className={cx(styles.chat, mode === "ingame" && styles.ingame)}>
      <ol ref={logRef} className={styles.log} role="log" aria-label={`Mensagens de ${name}`}>
        {!compact && (
          <li className={styles.intro}>
            <h2 className={styles.introTitle}>{name}</h2>
            {intro && <p className={styles.introText}>{intro}</p>}
          </li>
        )}
        {mode === "sussurro" && list.length === 0 && (
          <li className={styles.intro}>
            <p className={styles.introText}>Nenhum sussurro com o mestre ainda. Os sussurros de outros jogadores não aparecem para você.</p>
          </li>
        )}
        <MessageList messages={list} viewerIsMaster={master} />
      </ol>
      {canWrite ? (
        <Composer
          channelKey={channelKey}
          mode={mode}
          placeholder={mode === "ingame" ? "Mensagem ingame" : mode === "sussurro" ? "Sussurro" : `Conversar em ${name}`}
        />
      ) : (
        <div className={styles.composer}>
          <p className={styles.readOnly}>
            <Icon name="lock" size={16} />
            Só o Narrador publica aqui.
          </p>
        </div>
      )}
    </div>
  );
}
