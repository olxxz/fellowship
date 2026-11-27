"use client";

import { Button, Modal, toast } from "@fellowship/ui";
import type { LocalAudioTrack, Participant, RemoteParticipant, RemoteTrack, Room } from "livekit-client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { readPref, useFlag, usePref, writePref } from "@/lib/prefs";
import { voiceEnabled } from "./useMesaVoice";
import { VoiceSettingsDialog } from "./VoiceSettingsDialog";

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
  /** Aparelhos e áudio (salvos por navegador). */
  devices: VoiceDevices;
  setDevice: (kind: MediaDeviceKind, deviceId: string) => void;
  refreshDevices: () => Promise<void>;
  krispSupported: boolean;
  krisp: boolean;
  setKrisp: (on: boolean) => void;
  browserProcessing: boolean;
  setBrowserProcessing: (on: boolean) => void;
  /** Volume de cada pessoa para você (0–100), salvo por pessoa. */
  volumeOf: (userId: string) => number;
  setVolumeOf: (userId: string, volume: number) => void;
  /** Nível do seu microfone agora (0–1), para o medidor nas configurações. */
  micLevel: () => number;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  /** Entra direto; se já estiver em outra sala, pergunta antes de trocar. */
  requestJoin: (channel: VoiceChannelRef) => void;
  join: (channel: VoiceChannelRef) => Promise<void>;
  leave: () => void;
}

export interface VoiceDevices {
  audioinput: MediaDeviceInfo[];
  audiooutput: MediaDeviceInfo[];
  videoinput: MediaDeviceInfo[];
  selected: Record<MediaDeviceKind, string>;
}

const PREF_DEVICE: Record<MediaDeviceKind, string> = { audioinput: "voz:microfone", audiooutput: "voz:saida", videoinput: "voz:camera" };
const volumeKey = (userId: string) => `voz:volume:${userId}`;
const readVolume = (userId: string) => {
  const v = Number(readPref(volumeKey(userId)));
  return Number.isFinite(v) && readPref(volumeKey(userId)) !== null ? Math.min(100, Math.max(0, v)) : 100;
};

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

/** iPhone/iPad (inclusive iPad que se diz Mac): o Krisp roda num AudioContext que o Safari deixa mudo. */
const isIOS = () => typeof navigator !== "undefined" && (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1));

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
  const [mic] = usePref("voz:microfone", "");
  const [speaker] = usePref("voz:saida", "");
  const [cam] = usePref("voz:camera", "");
  const [krisp, setKrispPref] = useFlag("voz:krisp", true);
  const [browserProcessing, setBrowserProcessingPref] = useFlag("voz:processamento", true);
  const [krispSupported, setKrispSupported] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lists, setLists] = useState<Omit<VoiceDevices, "selected">>({ audioinput: [], audiooutput: [], videoinput: [] });
  const [, setVolumesVersion] = useState(0);
  // Valores lidos dentro do join (que é memorizado): ficam em refs sincronizadas com as preferências.
  const settingsRef = useRef({ mic, speaker, cam, krisp, browserProcessing });
  useEffect(() => {
    settingsRef.current = { mic, speaker, cam, krisp, browserProcessing };
  }, [mic, speaker, cam, krisp, browserProcessing]);
  const krispRef = useRef<{ setEnabled: (on: boolean) => Promise<unknown> } | null>(null);
  const roomRef = useRef<Room | null>(null);
  // Sala em que a pessoa quer estar (para reconectar sozinho se cair); null depois de "Sair".
  const wantedRef = useRef<VoiceChannelRef | null>(null);
  const joinRef = useRef<((channel: VoiceChannelRef) => Promise<void>) | null>(null);

  const reset = useCallback(() => {
    roomRef.current = null;
    // Some com o áudio da sala que ficou pendurado na página.
    document.querySelectorAll("audio[data-voz]").forEach((el) => el.remove());
    setRoom(null);
    setCurrent(null);
    setStatus("off");
    setCameraOn(false);
    setScreenOn(false);
    setPeople([]);
  }, []);

  const leave = useCallback(() => {
    wantedRef.current = null;
    const r = roomRef.current;
    reset();
    void r?.disconnect();
  }, [reset]);

  const applyKrisp = useCallback(async (track: LocalAudioTrack) => {
    try {
      if (isIOS()) return;
      const { KrispNoiseFilter, isKrispNoiseFilterSupported } = await import("@livekit/krisp-noise-filter");
      if (!isKrispNoiseFilterSupported()) return;
      const processor = KrispNoiseFilter();
      await track.setProcessor(processor);
      await processor.setEnabled(settingsRef.current.krisp);
      krispRef.current = processor;
    } catch (e) {
      console.warn("Supressor de ruído indisponível", e);
    }
  }, []);

  const join = useCallback(
    async (channel: VoiceChannelRef) => {
      const old = roomRef.current;
      if (old) {
        roomRef.current = null;
        void old.disconnect();
      }
      setRoom(null);
      setPeople([]);
      wantedRef.current = channel;
      setCurrent(channel);
      setStatus("connecting");
      setError(null);
      setCameraOn(false);
      setScreenOn(false);
      try {
        const res = await fetch("/api/livekit/canal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId: channel.id }) });
        const data = (await res.json().catch(() => ({}))) as { token?: string; url?: string; error?: string; canSpeak?: boolean };
        if (!res.ok || !data.token) throw new Error(data.error ?? "Não foi possível entrar na voz agora.");
        const { Room, RoomEvent, VideoPresets, ScreenSharePresets, DisconnectReason } = await import("livekit-client");
        const next = new Room({
          // No celular, trocar de app dispara "pagehide": sem isto o LiveKit derruba a chamada sozinho.
          disconnectOnPageLeave: false,
          adaptiveStream: true,
          dynacast: true,
          // Câmera em 720p com camadas menores para quadros pequenos; tela nítida para texto (fichas, mapas).
          videoCaptureDefaults: { resolution: VideoPresets.h720.resolution, deviceId: settingsRef.current.cam || undefined },
          publishDefaults: {
            videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
            screenShareEncoding: ScreenSharePresets.h1080fps15.encoding,
          },
          audioCaptureDefaults: {
            deviceId: settingsRef.current.mic || undefined,
            echoCancellation: settingsRef.current.browserProcessing,
            noiseSuppression: settingsRef.current.browserProcessing,
            autoGainControl: settingsRef.current.browserProcessing,
          },
          audioOutput: settingsRef.current.speaker ? { deviceId: settingsRef.current.speaker } : undefined,
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
        // Supressor de ruído (Krisp, do LiveKit Cloud) no microfone assim que ele é publicado.
        next.on(RoomEvent.LocalTrackPublished, (pub) => {
          if (pub.source !== "microphone" || !pub.track) return;
          void applyKrisp(pub.track as LocalAudioTrack);
        });
        // Áudio de quem está na sala, em qualquer página do app (antes só tocava com a sala aberta na tela).
        next.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind !== "audio") return;
          const el = track.attach();
          el.dataset.voz = "";
          el.style.display = "none";
          document.body.appendChild(el);
        });
        next.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          if (track.kind === "audio") track.detach().forEach((el) => el.remove());
        });
        // iPhone e alguns navegadores só tocam áudio depois de um toque na tela: o próximo toque libera.
        const unlock = () => {
          if (roomRef.current !== next || next.canPlaybackAudio) return;
          void next.startAudio().catch(() => {});
        };
        next.on(RoomEvent.AudioPlaybackStatusChanged, () => {
          if (next.canPlaybackAudio) return;
          toast.info("Toque na tela para ouvir a sala", "O navegador só libera o som depois de um toque.");
          document.addEventListener("pointerdown", unlock, { once: true });
        });
        // Volume que você escolheu para cada pessoa.
        const applyVolume = (p: RemoteParticipant) => p.setVolume(readVolume(p.attributes.userId ?? p.identity.slice(0, 36)) / 100);
        next.on(RoomEvent.ParticipantConnected, applyVolume);
        next.on(RoomEvent.TrackSubscribed, (_t, _pub, p) => applyVolume(p));
        next.on(RoomEvent.LocalTrackUnpublished, (pub) => {
          if (pub.source === "screen_share") setScreenOn(false);
          sync();
        });
        next.on(RoomEvent.Disconnected, (reason?: number) => {
          if (roomRef.current !== next) return;
          // Entrou na voz em outro aparelho/aba: este sai sem tentar voltar (senão os dois ficam se derrubando).
          if (reason === DisconnectReason.DUPLICATE_IDENTITY) {
            wantedRef.current = null;
            reset();
            toast.info("Voz", "Você entrou na voz em outro aparelho ou aba.");
            return;
          }
          // Caiu sem a pessoa pedir (rede, celular em segundo plano): volta para a mesma sala.
          // Com a aba escondida, espera ela voltar.
          reset();
          wantedRef.current = channel;
          const rejoin = () => {
            if (wantedRef.current?.id !== channel.id) return;
            if (document.visibilityState === "visible") void joinRef.current?.(channel);
            else document.addEventListener("visibilitychange", rejoin, { once: true });
          };
          setTimeout(rejoin, 1000);
        });
        try {
          await next.connect(data.url || process.env.NEXT_PUBLIC_LIVEKIT_URL!, data.token);
        } catch (e) {
          console.error("Falha ao conectar no LiveKit", e);
          throw new Error("Não foi possível conectar ao servidor de voz.", { cause: e });
        }
        roomRef.current = next;
        // Tenta liberar o som já (funciona se o toque de "entrar" ainda vale); se não, o próximo toque libera.
        if (!next.canPlaybackAudio) {
          void next.startAudio().catch(() => {});
          document.addEventListener("pointerdown", unlock, { once: true });
        }
        setCanSpeak(data.canSpeak !== false);
        setRoom(next);
        setStatus("on");
        sync();
        // Aparece como mídia tocando (tela de bloqueio/central de controle): ajuda o sistema a manter o áudio vivo.
        if ("mediaSession" in navigator && typeof MediaMetadata !== "undefined") {
          navigator.mediaSession.metadata = new MediaMetadata({ title: channel.name, artist: "Sala de voz" });
        }
      } catch (e) {
        wantedRef.current = null;
        setCurrent(null);
        setStatus("off");
        setError(describe(e));
      }
    },
    [reset, applyKrisp],
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

  useEffect(() => {
    joinRef.current = join;
  }, [join]);

  // Erros de voz também aparecem em aviso (popup), em qualquer página.
  useEffect(() => {
    if (error) toast.error("Voz", error);
  }, [error]);

  useEffect(() => {
    void import("@livekit/krisp-noise-filter")
      .then(({ isKrispNoiseFilterSupported }) => setKrispSupported(isKrispNoiseFilterSupported()))
      .catch(() => setKrispSupported(false));
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const { Room } = await import("livekit-client");
      const [audioinput, audiooutput, videoinput] = await Promise.all([
        Room.getLocalDevices("audioinput", true),
        Room.getLocalDevices("audiooutput", false),
        Room.getLocalDevices("videoinput", false),
      ]);
      setLists({ audioinput, audiooutput, videoinput });
    } catch (e) {
      setError(describe(e));
    }
  }, []);

  const setDevice = useCallback((kind: MediaDeviceKind, deviceId: string) => {
    writePref(PREF_DEVICE[kind], deviceId);
    const r = roomRef.current;
    if (r && deviceId) void r.switchActiveDevice(kind, deviceId).catch((e: unknown) => setError(describe(e)));
  }, []);

  const setKrisp = useCallback(
    (on: boolean) => {
      setKrispPref(on);
      void krispRef.current?.setEnabled(on);
    },
    [setKrispPref],
  );

  const setBrowserProcessing = useCallback(
    (on: boolean) => {
      setBrowserProcessingPref(on);
      const track = roomRef.current?.localParticipant.getTrackPublication("microphone" as never)?.track as LocalAudioTrack | undefined;
      void track
        ?.restartTrack({ deviceId: settingsRef.current.mic || undefined, echoCancellation: on, noiseSuppression: on, autoGainControl: on })
        .catch((e: unknown) => setError(describe(e)));
    },
    [setBrowserProcessingPref],
  );

  const setVolumeOf = useCallback((userId: string, volume: number) => {
    writePref(volumeKey(userId), String(Math.round(volume)));
    setVolumesVersion((v) => v + 1);
    for (const p of roomRef.current?.remoteParticipants.values() ?? []) {
      if ((p.attributes.userId ?? p.identity.slice(0, 36)) === userId) p.setVolume(volume / 100);
    }
  }, []);

  const micLevel = useCallback(() => roomRef.current?.localParticipant.audioLevel ?? 0, []);

  // Em segundo plano o celular corta a câmera: desligamos nós mesmos (fica só a voz) e a pessoa religa ao voltar.
  useEffect(() => {
    const onVisibility = () => {
      const r = roomRef.current;
      if (document.visibilityState !== "hidden" || !r || !cameraOn) return;
      void r.localParticipant.setCameraEnabled(false);
      setCameraOn(false);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [cameraOn]);

  // Fechar a aba ou sair do app de vez: desconecta (o pagehide do LiveKit está desligado).
  useEffect(() => {
    const onUnload = () => void roomRef.current?.disconnect();
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      void roomRef.current?.disconnect();
    };
  }, []);

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
      devices: { ...lists, selected: { audioinput: mic, audiooutput: speaker, videoinput: cam } },
      setDevice,
      refreshDevices,
      krispSupported,
      krisp,
      setKrisp,
      browserProcessing,
      setBrowserProcessing,
      volumeOf: readVolume,
      setVolumeOf,
      micLevel,
      settingsOpen,
      setSettingsOpen,
      requestJoin,
      join,
      leave,
    }),
    [current, room, status, error, canSpeak, muted, setMuted, cameraOn, toggleCamera, screenOn, toggleScreen, people, lists, mic, speaker, cam, setDevice, refreshDevices, krispSupported, krisp, setKrisp, browserProcessing, setBrowserProcessing, setVolumeOf, micLevel, settingsOpen, requestJoin, join, leave],
  );

  return (
    <VoiceContext.Provider value={value}>
      {children}
      <VoiceSettingsDialog />
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
