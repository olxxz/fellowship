"use client";

// Carregado sob demanda: o SDK do LiveKit só pesa quando a pessoa está numa sala.
import { Avatar, cx, Icon, playerColorStyle, Popover } from "@fellowship/ui";
import { useVoice } from "@/lib/livekit/VoiceProvider";
import { isTrackReference, RoomAudioRenderer, RoomContext, useSpeakingParticipants, useTracks, VideoTrack, type TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { Track, type Participant, type Room } from "livekit-client";
import { useEffect, useRef, useState } from "react";
import styles from "./VoiceRoom.module.sass";

export interface VoiceProfile {
  display_name: string;
  avatar_url: string | null;
  color: string;
}

const userIdOf = (p: Participant) => p.attributes.userId ?? p.identity.slice(0, 36);
const keyOf = (t: TrackReferenceOrPlaceholder) => `${t.participant.identity}:${t.source}`;

export default function VoiceTiles({ room, profiles }: { room: Room; profiles: Record<string, VoiceProfile> }) {
  return (
    <RoomContext.Provider value={room}>
      <RoomAudioRenderer />
      <Tiles profiles={profiles} />
    </RoomContext.Provider>
  );
}

const GAP = 12;
const RATIO = 16 / 10;

/** Melhor número de colunas para n quadros 16:10 caberem no espaço com o maior tamanho possível. */
function fitGrid(n: number, width: number, height: number) {
  let best = { cols: 1, tileW: 0 };
  for (let cols = 1; cols <= Math.max(1, n); cols++) {
    const rows = Math.ceil(n / cols);
    const byWidth = (width - GAP * (cols - 1)) / cols;
    const byHeight = ((height - GAP * (rows - 1)) / rows) * RATIO;
    const tileW = Math.floor(Math.min(byWidth, byHeight));
    if (tileW > best.tileW) best = { cols, tileW };
  }
  return best;
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry!.contentRect;
      setSize({ width: box.width, height: box.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/**
 * Grade: os quadros (câmera ou avatar, e telas compartilhadas) crescem para ocupar o espaço e se
 * reorganizam a cada pessoa que entra. Foco: um quadro grande e os outros numa faixa embaixo.
 * Clicar num quadro o põe em foco; uma tela compartilhada nova entra em foco sozinha.
 */
function Tiles({ profiles }: { profiles: Record<string, VoiceProfile> }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  const speakers = useSpeakingParticipants();
  const [mode, setMode] = useState<"auto" | "grid" | string>("auto");
  const [areaRef, area] = useSize<HTMLDivElement>();

  const firstScreen = tracks.find((t) => t.source === Track.Source.ScreenShare && isTrackReference(t));
  const focus =
    mode === "grid" ? null : mode !== "auto" && tracks.some((t) => keyOf(t) === mode) ? mode : firstScreen && tracks.length > 1 ? keyOf(firstScreen) : null;

  const tile = (t: TrackReferenceOrPlaceholder, width: number | undefined, variant: "grid" | "stage" | "strip") => {
    const p = t.participant;
    const key = keyOf(t);
    const profile = profiles[userIdOf(p)];
    const name = profile?.display_name ?? p.name ?? "Alguém";
    const screen = t.source === Track.Source.ScreenShare;
    const speaking = !screen && speakers.some((s) => s.identity === p.identity);
    const video = isTrackReference(t) && !t.publication.isMuted ? t : null;
    const label = screen ? `Tela de ${name}` : `${name}${speaking ? ", falando" : ""}${p.isMicrophoneEnabled ? "" : ", microfone desligado"}`;
    const avatar = Math.round(Math.min(140, Math.max(40, (width ?? 160) * 0.26)));
    return (
      <li
        key={key}
        className={cx(styles.tile, speaking && styles.speaking, video && styles.hasVideo, screen && styles.screenTile, variant === "stage" && styles.stageTile, variant === "strip" && styles.stripTile)}
        style={{ ...(profile ? playerColorStyle(profile.color) : {}), ...(width ? { width } : {}) }}
      >
        <button
          type="button"
          className={styles.tileButton}
          aria-label={`${label}. ${focus === key ? "Voltar à grade" : "Pôr em foco"}`}
          aria-pressed={focus === key}
          onClick={() => setMode(focus === key ? "grid" : key)}
        >
          {video ? (
            <VideoTrack trackRef={video} className={cx(styles.video, (screen || variant === "stage") && styles.videoContain, p.isLocal && !screen && styles.mirror)} />
          ) : (
            <Avatar name={name} src={profile?.avatar_url ?? undefined} color={profile?.color} size={variant === "strip" ? 40 : avatar} />
          )}
          <span className={styles.tileName}>
            {screen && <Icon name="screen" size={14} />}
            {screen ? `Tela de ${name}` : name}
          </span>
          {!screen && !p.isMicrophoneEnabled && (
            <span className={styles.mutedBadge} aria-hidden>
              <Icon name="micOff" size={16} />
            </span>
          )}
        </button>
        {!screen && !p.isLocal && variant !== "strip" && <VolumeControl userId={userIdOf(p)} name={name} />}
      </li>
    );
  };

  const focused = focus ? tracks.find((t) => keyOf(t) === focus) : undefined;
  const others = focused ? tracks.filter((t) => t !== focused) : tracks;
  const { tileW } = fitGrid(tracks.length, area.width, area.height);

  return (
    <div className={styles.stageArea}>
      {tracks.length > 1 && (
        <div className={styles.layoutToggle} role="group" aria-label="Layout">
          <button type="button" aria-pressed={!focused} onClick={() => setMode("grid")}>
            <Icon name="grid" size={16} />
            Grade
          </button>
          <button type="button" aria-pressed={!!focused} onClick={() => setMode(focused ? focus! : keyOf(firstScreen ?? tracks[0]!))}>
            <Icon name="fullscreen" size={16} />
            Foco
          </button>
        </div>
      )}
      <div ref={areaRef} className={styles.area}>
        {focused ? (
          <div className={styles.focusLayout}>
            <ul className={styles.stage}>{tile(focused, undefined, "stage")}</ul>
            {others.length > 0 && <ul className={styles.strip}>{others.map((t) => tile(t, 180, "strip"))}</ul>}
          </div>
        ) : (
          <ul className={styles.grid} aria-label="Pessoas na sala">
            {tracks.map((t) => tile(t, tileW || undefined, "grid"))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Volume de uma pessoa só para você (fica salvo neste navegador). */
function VolumeControl({ userId, name }: { userId: string; name: string }) {
  const voice = useVoice();
  const [value, setValue] = useState(() => voice.volumeOf(userId));
  return (
    <Popover.Root>
      <Popover.Trigger
        className={styles.volumeButton}
        aria-label={`Volume de ${name}: ${value}%`}
        onClick={(e) => e.stopPropagation()}
      >
        <Icon name="voice" size={16} />
      </Popover.Trigger>
      <Popover.Popup side="bottom" title={`Volume de ${name}`}>
        <label className={styles.volumeRow} onClick={(e) => e.stopPropagation()}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={value}
            onChange={(e) => {
              const v = Number(e.target.value);
              setValue(v);
              voice.setVolumeOf(userId, v);
            }}
            aria-label={`Volume de ${name}`}
          />
          <span>{value}%</span>
        </label>
      </Popover.Popup>
    </Popover.Root>
  );
}
