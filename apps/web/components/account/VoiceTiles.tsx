"use client";

// Carregado sob demanda: o SDK do LiveKit só pesa quando a pessoa está numa sala.
import { Avatar, cx, Icon, playerColorStyle } from "@fellowship/ui";
import { isTrackReference, RoomAudioRenderer, RoomContext, useParticipants, useSpeakingParticipants, useTracks, VideoTrack } from "@livekit/components-react";
import { Track, type Participant, type Room } from "livekit-client";
import styles from "./VoiceRoom.module.sass";

export interface VoiceProfile {
  display_name: string;
  avatar_url: string | null;
  color: string;
}

const userIdOf = (p: Participant) => p.attributes.userId ?? p.identity.slice(0, 36);

export default function VoiceTiles({ room, profiles }: { room: Room; profiles: Record<string, VoiceProfile> }) {
  return (
    <RoomContext.Provider value={room}>
      <RoomAudioRenderer />
      <Tiles profiles={profiles} />
    </RoomContext.Provider>
  );
}

function Tiles({ profiles }: { profiles: Record<string, VoiceProfile> }) {
  const participants = useParticipants();
  const speakers = useSpeakingParticipants();
  const cameras = useTracks([Track.Source.Camera]).filter(isTrackReference);

  return (
    <ul className={styles.grid} aria-label="Pessoas na sala">
      {participants.map((p) => {
        const profile = profiles[userIdOf(p)];
        const name = profile?.display_name ?? p.name ?? "Alguém";
        const speaking = speakers.some((s) => s.identity === p.identity);
        const camera = cameras.find((t) => t.participant.identity === p.identity && !t.publication.isMuted);
        return (
          <li
            key={p.identity}
            className={cx(styles.tile, speaking && styles.speaking, camera && styles.hasVideo)}
            style={profile ? playerColorStyle(profile.color) : undefined}
            aria-label={`${name}${speaking ? ", falando" : ""}${p.isMicrophoneEnabled ? "" : ", microfone desligado"}`}
          >
            {camera ? <VideoTrack trackRef={camera} className={styles.video} /> : <Avatar name={name} src={profile?.avatar_url ?? undefined} color={profile?.color} size={72} />}
            <span className={styles.tileName}>{name}</span>
            {!p.isMicrophoneEnabled && (
              <span className={styles.mutedBadge} aria-hidden>
                <Icon name="micOff" size={16} />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
