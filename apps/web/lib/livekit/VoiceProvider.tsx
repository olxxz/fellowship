"use client";

import type { Room } from "livekit-client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFlag } from "@/lib/prefs";
import { voiceEnabled } from "./useMesaVoice";

export interface VoiceChannelRef {
  id: string;
  name: string;
  spaceId: string;
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
  join: (channel: VoiceChannelRef) => Promise<void>;
  leave: () => void;
}

const VoiceContext = createContext<VoiceState | null>(null);

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice precisa do VoiceProvider");
  return ctx;
}

/** Igual a useVoice, mas sem erro fora do provider (painel da conta no Início, por exemplo). */
export const useOptionalVoice = () => useContext(VoiceContext);

function describe(error: unknown, device = "microfone") {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError") return `O navegador bloqueou o ${device}. Permita o acesso nas configurações do site e tente de novo.`;
  if (name === "NotFoundError") return `Nenhum ${device} encontrado.`;
  return error instanceof Error && error.message ? error.message : "Não foi possível entrar na voz agora.";
}

/**
 * Conexão de voz do Cenário. Fica no layout do Cenário: trocar de canal (ir para o chat, configurações)
 * não derruba a voz, como no Discord. Sair do Cenário ou da página desconecta.
 */
export function VoiceProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<VoiceChannelRef | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [status, setStatus] = useState<VoiceState["status"]>("off");
  const [error, setError] = useState<string | null>(null);
  const [canSpeak, setCanSpeak] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [muted, setMuted] = useFlag("mutado", false);
  const roomRef = useRef<Room | null>(null);

  const leave = useCallback(() => {
    const r = roomRef.current;
    roomRef.current = null;
    setRoom(null);
    setCurrent(null);
    setStatus("off");
    setCameraOn(false);
    void r?.disconnect();
  }, []);

  const join = useCallback(async (channel: VoiceChannelRef) => {
    if (roomRef.current) {
      const old = roomRef.current;
      roomRef.current = null;
      setRoom(null);
      void old.disconnect();
    }
    setCurrent(channel);
    setStatus("connecting");
    setError(null);
    setCameraOn(false);
    try {
      const res = await fetch("/api/livekit/canal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId: channel.id }) });
      const data = (await res.json().catch(() => ({}))) as { token?: string; url?: string; error?: string; canSpeak?: boolean };
      if (!res.ok || !data.token) throw new Error(data.error ?? "Não foi possível entrar na voz agora.");
      const { Room, RoomEvent } = await import("livekit-client");
      const next = new Room({ adaptiveStream: true, dynacast: true });
      next.on(RoomEvent.Disconnected, () => {
        if (roomRef.current !== next) return;
        roomRef.current = null;
        setRoom(null);
        setCurrent(null);
        setStatus("off");
        setCameraOn(false);
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
    } catch (e) {
      setCurrent(null);
      setStatus("off");
      setError(describe(e));
    }
  }, []);

  const toggleCamera = useCallback(async () => {
    const r = roomRef.current;
    if (!r) return;
    try {
      await r.localParticipant.setCameraEnabled(!cameraOn);
      setCameraOn(!cameraOn);
    } catch (e) {
      setError(describe(e, "câmera"));
    }
  }, [cameraOn]);

  // O microfone segue o botão "mutado" (o mesmo do painel da conta).
  useEffect(() => {
    if (!room || !canSpeak) return;
    room.localParticipant.setMicrophoneEnabled(!muted).catch((e: unknown) => setError(describe(e)));
  }, [room, muted, canSpeak]);

  useEffect(() => () => void roomRef.current?.disconnect(), []);

  const value = useMemo<VoiceState>(
    () => ({ enabled: voiceEnabled, current, room, status, error, canSpeak, muted, setMuted, cameraOn, toggleCamera: () => void toggleCamera(), join, leave }),
    [current, room, status, error, canSpeak, muted, setMuted, cameraOn, toggleCamera, join, leave],
  );
  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}
