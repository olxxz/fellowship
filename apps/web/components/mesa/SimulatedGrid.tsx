"use client";

import { useEffect, useState } from "react";
import { cardIds, ParticipantGrid, type ParticipantGridProps } from "./ParticipantGrid";

/**
 * Mesa sem voz (GitHub Pages, ou sem LiveKit configurado): simula quem está falando para o protótipo ter vida.
 * Com `simulate` desligado, ninguém fala.
 */
export function SimulatedGrid({ simulate, myMuted, ...grid }: Omit<ParticipantGridProps, "presence"> & { simulate: boolean; myMuted: boolean }) {
  const [speakingId, setSpeakingId] = useState<string | null>("brom");
  const { campaign, myCardId } = grid;

  useEffect(() => {
    if (!simulate) return;
    const ids = cardIds(campaign);
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      const pool = [...ids.filter((id) => !(myMuted && id === myCardId)), null];
      setSpeakingId(pool[Math.floor(Math.random() * pool.length)] ?? null);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [simulate, myMuted, myCardId, campaign]);

  const presence = Object.fromEntries(
    cardIds(campaign).map((id) => [id, { speaking: simulate && speakingId === id, muted: myMuted && id === myCardId }]),
  );
  return <ParticipantGrid {...grid} presence={presence} />;
}
