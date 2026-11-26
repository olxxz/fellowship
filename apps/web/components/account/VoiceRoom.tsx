"use client";

import { Avatar, Button, Icon, IconButton } from "@fellowship/ui";
import type { Channel } from "@fellowship/db";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useVoice } from "@/lib/livekit/VoiceProvider";
import type { VoiceProfile } from "./VoiceTiles";
import styles from "./VoiceRoom.module.sass";

const VoiceTiles = dynamic(() => import("./VoiceTiles"), { ssr: false });

interface Present {
  userId: string;
  name: string;
}

/** Quem já está na sala, para quem ainda não entrou (atualiza a cada 10 s enquanto a aba está visível). */
function usePresent(channelId: string, active: boolean) {
  const [present, setPresent] = useState<Present[]>([]);
  useEffect(() => {
    if (!active) return;
    let stop = false;
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await fetch(`/api/livekit/canal?canal=${channelId}`).catch(() => null);
      const data = (await res?.json().catch(() => null)) as { participants?: Present[] } | null;
      if (!stop && data?.participants) setPresent(data.participants);
    };
    void load();
    const timer = setInterval(() => void load(), 10_000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [channelId, active]);
  return present;
}

export function VoiceRoom({ channel, profiles }: { channel: Channel; profiles: Record<string, VoiceProfile> }) {
  const voice = useVoice();
  const here = voice.current?.id === channel.id;
  const connected = here && voice.status === "on" && voice.room;
  const present = usePresent(channel.id, voice.enabled && !connected);

  if (!voice.enabled) {
    return (
      <div className={styles.lobby}>
        <span className={styles.lobbyIcon}>
          <Icon name="voice" size={30} />
        </span>
        <h2 className={styles.lobbyTitle}>Voz indisponível</h2>
        <p className={styles.lobbyText}>O servidor de voz não está configurado neste endereço.</p>
      </div>
    );
  }

  if (connected) {
    return (
      <div className={styles.room}>
        <VoiceTiles room={voice.room!} profiles={profiles} />
        {voice.error && (
          <p className={styles.controlsError} role="alert">
            {voice.error}
          </p>
        )}
        <div className={styles.controls}>
          {voice.canSpeak && (
            <IconButton
              icon={voice.muted ? "micOff" : "mic"}
              label={voice.muted ? "Ativar microfone" : "Mutar microfone"}
              aria-pressed={voice.muted}
              variant={voice.muted ? "danger" : "secondary"}
              onClick={() => voice.setMuted(!voice.muted)}
            />
          )}
          {voice.canSpeak && (
            <IconButton
              icon={voice.cameraOn ? "camera" : "cameraOff"}
              label={voice.cameraOn ? "Desligar câmera" : "Ligar câmera"}
              aria-pressed={voice.cameraOn}
              onClick={voice.toggleCamera}
            />
          )}
          <Button variant="danger" icon="leave" onClick={voice.leave}>
            Sair da sala
          </Button>
        </div>
      </div>
    );
  }

  const elsewhere = voice.current && !here ? voice.current.name : null;
  return (
    <div className={styles.lobby}>
      <span className={styles.lobbyIcon}>
        <Icon name="voice" size={30} />
      </span>
      <h2 className={styles.lobbyTitle}>{channel.name}</h2>
      <p className={styles.lobbyText}>
        {present.length === 0 ? "Ninguém na sala agora." : `${present.length} ${present.length === 1 ? "pessoa" : "pessoas"} na sala.`}
        {elsewhere ? ` Entrar aqui tira você de ${elsewhere}.` : ""}
      </p>
      {present.length > 0 && (
        <ul className={styles.present}>
          {present.map((p) => {
            const profile = profiles[p.userId];
            return (
              <li key={p.userId} className={styles.presentItem}>
                <Avatar name={profile?.display_name ?? p.name} src={profile?.avatar_url ?? undefined} color={profile?.color} size={24} />
                {profile?.display_name ?? p.name}
              </li>
            );
          })}
        </ul>
      )}
      <Button
        variant="primary"
        icon="voice"
        loading={here && voice.status === "connecting"}
        loadingLabel="Entrando…"
        onClick={() => void voice.join({ id: channel.id, name: channel.name, spaceId: channel.space_id })}
      >
        Entrar na sala
      </Button>
      {voice.error && (
        <p className={styles.error} role="alert">
          {voice.error}
        </p>
      )}
    </div>
  );
}
