"use client";

import { Icon, Popover } from "@fellowship/ui";
import { EMOJI_GROUPS } from "@/lib/chat/emoji";
import styles from "./ChatRoom.module.sass";

/** Seletor de emoji num popover. `trigger` é o conteúdo do botão (ícone ou rótulo). */
export function EmojiPicker({ onPick, label, className, side = "top" }: { onPick: (emoji: string) => void; label: string; className?: string; side?: "top" | "bottom" }) {
  return (
    <Popover.Root>
      <Popover.Trigger className={className ?? styles.toolButton} aria-label={label} title={label}>
        <Icon name="smile" size={18} />
      </Popover.Trigger>
      <Popover.Popup side={side} align="end">
        <div className={styles.emojiPanel}>
          {EMOJI_GROUPS.map((g) => (
            <section key={g.name}>
              <h4 className={styles.emojiGroup}>{g.name}</h4>
              <div className={styles.emojiGrid}>
                {g.emojis.map((e) => (
                  <Popover.Close key={e} className={styles.emojiCell} onClick={() => onPick(e)} aria-label={e}>
                    {e}
                  </Popover.Close>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Popover.Popup>
    </Popover.Root>
  );
}
