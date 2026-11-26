"use client";

import { Button, Modal } from "@fellowship/ui";
import type { Participant, Room } from "livekit-client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFlag } from "@/lib/prefs";
import { voiceEnabled } from "./useMesaVoice";

export interface VoiceChannelRef {
  id: string;
  name: string;
  spaceId: string;
}

export interface VoicePerson {
  userId: string;
  name: string;
  avatarUrl: string;
  color: string;
  speaking?: boolean;
  muted?: boolean;
}

interface VoiceState {
  enabled: boolean;
  /** Canal em que a pessoa está conectada (ou entrando). */
  current: VoiceChannelRef | null;
  room: Room | null;
  status: "off" | "connecting" | "on";
  error: string | null;
  canSpeak: boolean;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  cameraOn: boolean;
  toggleCamera: () => void;
  screenOn: boolean;
  toggleScreen: () => void;
  /** Quem está na sala conectada, ao vivo (para a barra lateral). */
  people: VoicePerson[];
  /** Entra direto; se já estiver em outra sala, pergunta antes de trocar. */
  requestJoin: (channel: VoiceChannelRef) => void;
  join: (channel: VoiceChannelRef) => Promise<void>;
  leave: () => void;
}

const VoiceContext = createContext<VoiceState | null>(null);

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice precisa do VoiceProvider");
  return ctx;
}

export const useOptionalVoice = () => useContext(VoiceContext);

function describe(error: unknown, device: "microfone" | "câmera" | "tela" = "microfone") {
  const name = error instanceof Error ? error.name : "";
  const the = device === "microfone" ? "o microfone" : device === "câmera" ? "a câmera" : "o compartilhamento de tela";
  if (name === "NotAllowedError") return device === "tela" ? "Compartilhamento de tela cancelado ou bloqueado." : `O navegador bloqueou ${the}. Permita o acesso nas configurações do site e tente de novo.`;
  if (name === "NotFoundError") return device === "microfone" ? "Nenhum microfone encontrado." : "Nenhuma câmera encontrada.";
  return error instanceof Error && error.message ? error.message : "Não foi possível entrar na voz agora.";
}

const personOf = (p: Participant, speaking: Set<string>): VoicePerson => ({
  userId: p.attributes.userId ?? p.identity.slice(0, 36),
  name: p.name || "Alguém",
  avatarUrl: p.attributes.avatarUrl ?? "",
  color: p.attributes.color ?? "",
  speaking: speaking.has(p.identity),
  muted: !p.isMicrophoneEnabled,
});

/**
 * Conexão de voz da conta inteira (fica no layout das páginas logadas): navegar entre canais e
 * Cenários não derruba a voz, como no Discord. Fechar a aba desconecta.
 */
export function VoiceProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<VoiceChannelRef | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [status, setStatus] = useState<VoiceState["status"]>("off");
  const [error, setError] = useState<string | null>(null);
  const [canSpeak, setCanSpeak] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [people, setPeople] = useState<VoicePerson[]>([]);
  const [pendingSwitch, setPendingSwitch] = useState<VoiceChannelRef | null>(null);
  const [muted, setMuted] = useFlag("mutado", false);
  const roomRef = useRef<Room | null>(null);

  const reset = useCallback(() => {
    roomRef.current = null;
    setRoom(null);
    setCurrent(null);
    setStatus("off");
    setCameraOn(false);
    setScreenOn(false);
    setPeople([]);
  }, []);

  const leave = useCallback(() => {
    const r = roomRef.current;
    reset();
    void r?.disconnect();
  }, [reset]);

  const join = useCallback(
    async (channel: VoiceChannelRef) => {
      const old = roomRef.current;
      if (old) {
        roomRef.current = null;
        void old.disconnect();
      }
      setRoom(null);
      setPeople([]);
      setCurrent(channel);
      setStatus("connecting");
      setError(null);
      setCameraOn(false);
      setScreenOn(false);
      try {
        const res = await fetch("/api/livekit/canal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId: channel.id }) });
        const data = (await res.json().catch(() => ({}))) as { token?: string; url?: string; error?: string; canSpeak?: boolean };
        if (!res.ok || !data.token) throw new Error(data.error ?? "Não foi possível entrar na voz agora.");
        const { Room, RoomEvent, VideoPresets, ScreenSharePresets } = await import("livekit-client");
        const next = new Room({
          adaptiveStream: true,
          dynacast: true,
          // Câmera em 720p com camadas menores para quadros pequenos; tela nítida para texto (fichas, mapas).
          videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
          publishDefaults: {
            videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
            screenShareEncoding: ScreenSharePresets.h1080fps15.encoding,
          },
          audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        const sync = () => {
          if (roomRef.current !== next) return;
          const speaking = new Set(next.activeSpeakers.map((s) => s.identity));
          setPeople([next.localParticipant, ...next.remoteParticipants.values()].map((p) => personOf(p, speaking)));
        };
        for (const event of [
          RoomEvent.ParticipantConnected,
          RoomEvent.ParticipantDisconnected,
          RoomEvent.ActiveSpeakersChanged,
          RoomEvent.TrackMuted,
          RoomEvent.TrackUnmuted,
          RoomEvent.LocalTrackPublished,
          RoomEvent.TrackPublished,
          RoomEvent.TrackUnpublished,
        ])
          next.on(event, sync);
        next.on(RoomEvent.LocalTrackUnpublished, (pub) => {
          if (pub.source === "screen_share") setScreenOn(false);
          sync();
        });
        next.on(RoomEvent.Disconnected, () => {
          if (roomRef.current === next) reset();
        });
        try {
          await next.connect(data.url || process.env.NEXT_PUBLIC_LIVEKIT_URL!, data.token);
        } catch (e) {
          console.error("Falha ao conectar no LiveKit", e);
          throw new Error("Não foi possível conectar ao servidor de voz.", { cause: e });
        }
        roomRef.current = next;
        setCanSpeak(data.canSpeak !== false);
        setRoom(next);
        setStatus("on");
        sync();
      } catch (e) {
        setCurrent(null);
        setStatus("off");
        setError(describe(e));
      }
    },
    [reset],
  );

  const requestJoin = useCallback(
    (channel: VoiceChannelRef) => {
      if (current?.id === channel.id) return;
      if (current) setPendingSwitch(channel);
      else void join(channel);
    },
    [current, join],
  );

  const toggleCamera = useCallback(async () => {
    const r = roomRef.current;
    if (!r) return;
    try {
      await r.localParticipant.setCameraEnabled(!cameraOn);
      setCameraOn(!cameraOn);
      setError(null);
    } catch (e) {
      setError(describe(e, "câmera"));
    }
  }, [cameraOn]);

  const toggleScreen = useCallback(async () => {
    const r = roomRef.current;
    if (!r) return;
    try {
      await r.localParticipant.setScreenShareEnabled(!screenOn, { audio: true });
      setScreenOn(!screenOn);
      setError(null);
    } catch (e) {
      setError(describe(e, "tela"));
    }
  }, [screenOn]);

  // O microfone segue o botão "mutado" (o mesmo do painel da conta).
  useEffect(() => {
    if (!room || !canSpeak) return;
    room.localParticipant.setMicrophoneEnabled(!muted).catch((e: unknown) => setError(describe(e)));
  }, [room, muted, canSpeak]);

  useEffect(() => () => void roomRef.current?.disconnect(), []);

  const value = useMemo<VoiceState>(
    () => ({
      enabled: voiceEnabled,
      current,
      room,
      status,
      error,
      canSpeak,
      muted,
      setMuted,
      cameraOn,
      toggleCamera: () => void toggleCamera(),
      screenOn,
      toggleScreen: () => void toggleScreen(),
      people,
      requestJoin,
      join,
      leave,
    }),
    [current, room, status, error, canSpeak, muted, setMuted, cameraOn, toggleCamera, screenOn, toggleScreen, people, requestJoin, join, leave],
  );

  return (
    <VoiceContext.Provider value={value}>
      {children}
      <Modal
        open={!!pendingSwitch}
        onOpenChange={(open) => !open && setPendingSwitch(null)}
        title="Trocar de sala?"
        description={pendingSwitch && current ? `Você está em ${current.name}. Sair dela e entrar em ${pendingSwitch.name}?` : undefined}
      >
        <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Button onClick={() => setPendingSwitch(null)}>Continuar onde estou</Button>
          <Button
            variant="primary"
            icon="mic"
            onClick={() => {
              const target = pendingSwitch;
              setPendingSwitch(null);
              if (target) void join(target);
            }}
          >
            Trocar de sala
          </Button>
        </div>
      </Modal>
    </VoiceContext.Provider>
  );
}
