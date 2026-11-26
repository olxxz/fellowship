"use client";

import { Avatar, cx, Icon } from "@fellowship/ui";
import { useEffect, useState } from "react";
import type { VoicePerson } from "@/lib/livekit/VoiceProvider";
import styles from "@/components/shell/Sidebar.module.sass";

/** Quem está em cada sala de voz do Cenário (atualiza a cada 15 s com a aba visível). */
export function useSpaceVoicePresence(spaceId: string, enabled: boolean) {
  const [rooms, setRooms] = useState<Record<string, VoicePerson[]>>({});
  useEffect(() => {
    if (!enabled) return;
    let stop = false;
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await fetch(`/api/livekit/canal?space=${spaceId}`).catch(() => null);
      const data = (await res?.json().catch(() => null)) as { rooms?: Record<string, VoicePerson[]> } | null;
      if (!stop && data?.rooms) setRooms(data.rooms);
    };
    void load();
    const timer = setInterval(() => void load(), 15_000);
    document.addEventListener("visibilitychange", load);
    return () => {
      stop = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [spaceId, enabled]);
  return rooms;
}

/** Lista de pessoas embaixo do canal de voz na barra lateral, como no Discord. */
export function VoicePeople({ people }: { people: VoicePerson[] }) {
  if (!people.length) return null;
  return (
    <ul className={styles.voicePeople} aria-label="Na sala">
      {people.map((p) => (
        <li key={p.userId} className={cx(styles.voicePerson, p.speaking && styles.voiceSpeaking)}>
          <Avatar name={p.name} src={p.avatarUrl || undefined} color={p.color || undefined} size={22} />
          <span className={styles.voiceName}>{p.name}</span>
          {p.muted && <Icon name="micOff" size={14} className={styles.voiceMuted} />}
        </li>
      ))}
    </ul>
  );
}
