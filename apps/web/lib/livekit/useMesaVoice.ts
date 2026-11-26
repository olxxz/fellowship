"use client";

import type { Room } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceStatus = "off" | "connecting" | "on";

/** A voz só existe no deploy com servidor e com o endereço do LiveKit configurado. */
export const voiceEnabled = process.env.NEXT_PUBLIC_VOICE_ENABLED === "1";

function describe(error: unknown) {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError") return "O navegador bloqueou o microfone. Permita o acesso nas configurações do site e tente de novo.";
  if (name === "NotFoundError") return "Nenhum microfone encontrado.";
  return error instanceof Error && error.message ? error.message : "Não foi possível entrar na voz agora.";
}

/**
 * Liga a Mesa a uma sala do LiveKit: pede o token ao servidor, conecta e mantém o microfone
 * sincronizado com a preferência "mutado" (o mesmo botão do painel do usuário e da Mesa).
 */
export function useMesaVoice({ roomName, userId, micEnabled }: { roomName: string; userId: string; micEnabled: boolean }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [status, setStatus] = useState<VoiceStatus>("off");
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const roomRef = useRef<Room | null>(null);

  const join = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomName, userId }),
      });
      const data = (await res.json().catch(() => ({}))) as { token?: string; url?: string; error?: string };
      if (!res.ok || !data.token) throw new Error(data.error ?? "Não foi possível entrar na voz agora.");

      const { Room, RoomEvent } = await import("livekit-client");
      const next = new Room({ adaptiveStream: true, dynacast: true });
      next.on(RoomEvent.Disconnected, () => {
        if (roomRef.current === next) roomRef.current = null;
        setRoom((current) => (current === next ? null : current));
        setStatus("off");
        setCameraOn(false);
      });
      try {
        await next.connect(data.url || process.env.NEXT_PUBLIC_LIVEKIT_URL!, data.token);
      } catch (e) {
        console.error("Falha ao conectar no LiveKit", e);
        throw new Error("Não foi possível conectar ao servidor de voz. Confira o NEXT_PUBLIC_LIVEKIT_URL e as chaves do LiveKit.", { cause: e });
      }
      roomRef.current = next;
      setRoom(next);
      setStatus("on");
    } catch (e) {
      setStatus("off");
      setError(describe(e));
    }
  }, [roomName, userId]);

  const leave = useCallback(() => {
    void roomRef.current?.disconnect();
  }, []);

  const toggleCamera = useCallback(async () => {
    const r = roomRef.current;
    if (!r) return;
    try {
      await r.localParticipant.setCameraEnabled(!cameraOn);
      setCameraOn(!cameraOn);
    } catch (e) {
      setError(describe(e).replace("microfone", "câmera"));
    }
  }, [cameraOn]);

  // O microfone segue a preferência "mutado".
  useEffect(() => {
    if (!room) return;
    room.localParticipant.setMicrophoneEnabled(micEnabled).catch((e: unknown) => setError(describe(e)));
  }, [room, micEnabled]);

  // Sair da página ou trocar de usuário ("Você é") desconecta.
  useEffect(() => () => void roomRef.current?.disconnect(), [userId]);

  return { room, status, error, cameraOn, join, leave, toggleCamera };
}
