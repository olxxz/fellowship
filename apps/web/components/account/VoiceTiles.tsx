"use client";

// Carregado sob demanda: o SDK do LiveKit só pesa quando a pessoa está numa sala.
import { Avatar, cx, Icon, playerColorStyle } from "@fellowship/ui";
import { isTrackReference, RoomAudioRenderer, RoomContext, useSpeakingParticipants, useTracks, VideoTrack, type TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { Track, type Participant, type Room } from "livekit-client";
import { useState } from "react";
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

/**
 * Um quadro por pessoa (câmera ou avatar) e um por tela compartilhada. Clicar num quadro o destaca
 * em tamanho grande (e o LiveKit passa a mandar a camada de vídeo maior); clicar de novo volta à grade.
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
  const [focused, setFocused] = useState<string | null>(null);
  // Uma tela compartilhada nova ganha destaque sozinha, se nada estiver destacado.
  const firstScreen = tracks.find((t) => t.source === Track.Source.ScreenShare && isTrackReference(t));
  const focus = focused && tracks.some((t) => keyOf(t) === focused) ? focused : firstScreen ? keyOf(firstScreen) : null;

  return (
    <ul className={cx(styles.grid, focus && styles.gridFocused)} aria-label="Pessoas na sala">
      {tracks.map((t) => {
        const p = t.participant;
        const key = keyOf(t);
        const profile = profiles[userIdOf(p)];
        const name = profile?.display_name ?? p.name ?? "Alguém";
        const screen = t.source === Track.Source.ScreenShare;
        const speaking = !screen && speakers.some((s) => s.identity === p.identity);
        const video = isTrackReference(t) && !t.publication.isMuted ? t : null;
        const label = screen ? `Tela de ${name}` : `${name}${speaking ? ", falando" : ""}${p.isMicrophoneEnabled ? "" : ", microfone desligado"}`;
        return (
          <li
            key={key}
            className={cx(styles.tile, speaking && styles.speaking, video && styles.hasVideo, screen && styles.screenTile, focus === key && styles.focused)}
            style={profile ? playerColorStyle(profile.color) : undefined}
          >
            <button type="button" className={styles.tileButton} aria-label={`${label}. ${focus === key ? "Voltar à grade" : "Destacar"}`} aria-pressed={focus === key} onClick={() => setFocused(focus === key ? null : key)}>
              {video ? (
                <VideoTrack trackRef={video} className={cx(styles.video, screen && styles.videoContain)} />
              ) : (
                <Avatar name={name} src={profile?.avatar_url ?? undefined} color={profile?.color} size={72} />
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
          </li>
        );
      })}
    </ul>
  );
}
