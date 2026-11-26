"use client";

import { cx, Icon, IconButton, Menu, playerColorStyle } from "@fellowship/ui";
import { useId, useState, type KeyboardEvent } from "react";
import { characters, type DemoCharacter } from "@/lib/demo/data";
import { rollFormula } from "@/lib/demo/dice";
import { useDemo } from "@/lib/demo/store";
import styles from "./Chat.module.sass";

export type ChatMode = "ingame" | "outgame" | "sussurro";

const npcs = characters.filter((c) => c.ownerId === null);
const playerCharacters = characters.filter((c) => c.ownerId !== null);

/**
 * Caixa de mensagem. No ingame fala como personagem (o mestre escolhe Narrador ou um NPC); no outgame, como jogador.
 * `/r 1d20+5` rola dados; o mestre também tem `/ro` para rolagem oculta.
 */
export function Composer({ channelKey, mode, placeholder }: { channelKey: string; mode: ChatMode; placeholder: string }) {
  const { send, viewer, me, myCharacter } = useDemo();
  const master = viewer === "mestre";
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [npcId, setNpcId] = useState("narrador");
  const [whisperTarget, setWhisperTarget] = useState("kael");
  const hintId = useId();

  const speaker: DemoCharacter | undefined =
    mode === "outgame" ? undefined : master ? characters.find((c) => c.id === npcId) : myCharacter;
  const whisperTo = mode === "sussurro" ? (master ? characters.find((c) => c.id === whisperTarget)!.name : "Narrador") : undefined;

  function submit() {
    const value = text.trim();
    if (!value) return;
    const command = value.match(/^\/(r|ro)\s+(.+)$/i);
    if (command) {
      const hidden = command[1]!.toLowerCase() === "ro";
      if (hidden && !master) return setError("Só o mestre faz rolagem oculta.");
      const result = rollFormula(command[2]!);
      if (!result) return setError("Não entendi a fórmula. Exemplos: /r 1d20+5, /r 2d20kh1 + 3, /r 3d6");
      send(channelKey, { type: "roll", authorId: me.id, characterId: speaker?.id, hidden, ...result });
    } else if (value.startsWith("/")) {
      return setError("Comando desconhecido. Use /r para rolar dados.");
    } else {
      send(channelKey, {
        type: "text",
        authorId: me.id,
        characterId: speaker?.id,
        text: value,
        narration: speaker?.id === "narrador",
        whisperTo,
      });
    }
    setText("");
    setError(null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  const chip = speaker && (
    <span style={playerColorStyle(speaker.color)}>
      como <span className={styles.asName}>{speaker.name}</span>
    </span>
  );

  return (
    <div className={styles.composer}>
      <div className={styles.box}>
        {mode !== "outgame" && (
          <div className={styles.as}>
            {master ? (
              <Menu.Root>
                <Menu.Trigger
                  className={styles.asChip}
                  aria-label={mode === "sussurro" ? `Sussurrar para ${whisperTo}` : `Falando como ${speaker?.name}. Trocar`}
                >
                  {mode === "sussurro" ? (
                    <>
                      <Icon name="lock" size={14} /> para <span className={styles.asName}>{whisperTo}</span>
                    </>
                  ) : (
                    chip
                  )}
                  <Icon name="chevronDown" size={14} />
                </Menu.Trigger>
                <Menu.Popup side="top">
                  {mode === "sussurro" ? (
                    <Menu.Group label="Sussurrar para">
                      <Menu.RadioGroup value={whisperTarget} onValueChange={(v: string) => setWhisperTarget(v)}>
                        {playerCharacters.map((c) => (
                          <Menu.RadioItem key={c.id} value={c.id}>
                            {c.name}
                          </Menu.RadioItem>
                        ))}
                      </Menu.RadioGroup>
                    </Menu.Group>
                  ) : (
                    <Menu.Group label="Falar como">
                      <Menu.RadioGroup value={npcId} onValueChange={(v: string) => setNpcId(v)}>
                        {npcs.map((c) => (
                          <Menu.RadioItem key={c.id} value={c.id}>
                            {c.name}
                          </Menu.RadioItem>
                        ))}
                      </Menu.RadioGroup>
                    </Menu.Group>
                  )}
                </Menu.Popup>
              </Menu.Root>
            ) : (
              <span className={styles.asChip}>{mode === "sussurro" ? <><Icon name="lock" size={14} /> para o mestre</> : chip}</span>
            )}
          </div>
        )}
        <textarea
          className={styles.input}
          rows={1}
          value={text}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-describedby={hintId}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={onKeyDown}
        />
        <IconButton icon="send" label="Enviar" variant={text.trim() ? "primary" : "secondary"} onClick={submit} />
      </div>
      {error ? (
        <p className={cx(styles.error)} id={hintId} role="alert">
          {error}
        </p>
      ) : (
        <p className={styles.hint} id={hintId}>
          Enter envia · <kbd>/r 1d20+5</kbd> rola dados{master ? " · /ro rola oculto" : ""}
        </p>
      )}
    </div>
  );
}
