"use client";

import { ParticipantCard, cx } from "@fellowship/ui";
import type { ReactNode } from "react";
import { characterById, userById, type DemoCampaign } from "@/lib/demo/data";
import styles from "./MesaView.module.sass";

export interface Presence {
  speaking?: boolean;
  muted?: boolean;
  offline?: boolean;
  video?: ReactNode;
}

export interface ParticipantGridProps {
  campaign: DemoCampaign;
  portraits: boolean;
  /** Card de quem está usando ("(você)"). */
  myCardId: string;
  /** Estado de cada card, por id do personagem. */
  presence: Record<string, Presence>;
}

/** Ids dos cards da Mesa: os personagens da campanha e o Narrador (o mestre). */
export const cardIds = (campaign: DemoCampaign) => [...campaign.characterIds, "narrador"];

/** Usuário dono de cada card: o jogador do personagem, ou o mestre para o Narrador. */
export const cardOwnerId = (campaign: DemoCampaign, characterId: string) => characterById(characterId)?.ownerId ?? campaign.masterId;

export function ParticipantGrid({ campaign, portraits, myCardId, presence }: ParticipantGridProps) {
  return (
    <div className={cx(styles.participants, portraits && styles.portraits)}>
      {cardIds(campaign).map((id) => {
        const character = characterById(id)!;
        const owner = userById(cardOwnerId(campaign, id))!;
        const p = presence[id] ?? {};
        return (
          <ParticipantCard
            key={id}
            variant={portraits ? "portrait" : "full"}
            characterName={character.name}
            playerName={id === myCardId ? `${owner.name} (você)` : owner.name}
            color={character.color}
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
