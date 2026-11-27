"use client";

import { ParticipantCard, cx } from "@fellowship/ui";
import type { ReactNode } from "react";
import styles from "./Mesa.module.sass";

export interface MesaSeat {
  userId: string;
  characterName: string;
  playerName: string;
  color: string;
  portraitUrl?: string;
  playerAvatarUrl?: string;
}

export interface SeatPresence {
  speaking?: boolean;
  muted?: boolean;
  offline?: boolean;
  video?: ReactNode;
}

/** Cards da Mesa: um por jogador (o personagem dele) e o Narrador (o mestre). */
export function MesaCards({ seats, presence, portraits, meId }: { seats: MesaSeat[]; presence: Record<string, SeatPresence>; portraits: boolean; meId: string }) {
  return (
    <div className={cx(styles.participants, portraits && styles.portraits)}>
      {seats.map((s) => {
        const p = presence[s.userId] ?? { offline: true };
        return (
          <ParticipantCard
            key={s.userId}
            variant={portraits ? "portrait" : "full"}
            characterName={s.characterName}
            playerName={s.userId === meId ? `${s.playerName} (você)` : s.playerName}
            color={s.color}
            portraitUrl={s.portraitUrl}
            playerAvatarUrl={s.playerAvatarUrl}
            speaking={p.speaking}
            muted={p.muted}
            offline={p.offline}
            video={p.video}
          />
        );
      })}
    </div>
  );
}
