"use client";

import { ChatMessage, ChatNotice, RollCard } from "@fellowship/ui";
import { characterById, userById, type DemoMessage } from "@/lib/demo/data";
import styles from "./Chat.module.sass";

function continues(prev: DemoMessage | undefined, msg: DemoMessage) {
  return prev?.type === "text" && msg.type === "text" && prev.authorId === msg.authorId && prev.characterId === msg.characterId && prev.whisperTo === msg.whisperTo;
}

/** Renderiza as mensagens: ingame mostra o personagem, outgame o jogador; rolagens viram cartões. */
export function MessageList({ messages, viewerIsMaster }: { messages: DemoMessage[]; viewerIsMaster: boolean }) {
  return (
    <>
      {messages.map((msg, i) => {
        const prev = messages[i - 1];
        if (msg.type === "notice") {
          return (
            <li key={msg.id}>
              <ChatNotice tone={msg.tone} icon={msg.icon}>
                {msg.text}
              </ChatNotice>
            </li>
          );
        }
        const user = userById(msg.authorId)!;
        const character = msg.characterId ? characterById(msg.characterId) : undefined;
        if (msg.type === "roll") {
          return (
            <li key={msg.id} className={styles.roll}>
              <RollCard
                roller={character?.name ?? user.name}
                label={msg.label}
                formula={msg.formula}
                dice={msg.dice}
                modifier={msg.modifier}
                total={msg.total}
                color={character?.color ?? user.color}
                hidden={msg.hidden}
                viewerIsMaster={viewerIsMaster}
                critical={msg.critical}
              />
            </li>
          );
        }
        const author = character ? { name: character.name, color: character.color } : { name: user.name, color: user.color };
        return (
          <li key={msg.id}>
            <ChatMessage
              scope={character ? "ingame" : "outgame"}
              author={author}
              subtitle={character ? (character.ownerId ? user.name : "mestre") : undefined}
              time={msg.time}
              continuation={continues(prev, msg)}
              pending={msg.pending}
              kind={msg.narration ? "narration" : "speech"}
              whisperTo={msg.whisperTo}
            >
              <p>{msg.text}</p>
            </ChatMessage>
          </li>
        );
      })}
    </>
  );
}
