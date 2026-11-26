"use client";

// Carregado sob demanda (next/dynamic) só quando a pessoa entra na voz: o SDK do LiveKit não pesa na Mesa sem voz.
import { isTrackReference, RoomAudioRenderer, RoomContext, useParticipants, useSpeakingParticipants, useTracks, VideoTrack } from "@livekit/components-react";
import { Track, type Participant, type Room } from "livekit-client";
import { cardIds, cardOwnerId, ParticipantGrid, type ParticipantGridProps, type Presence } from "./ParticipantGrid";

/** Usuário do grupo por trás de uma conexão (atributo gravado no token; o identity tem um sufixo aleatório). */
const userIdOf = (p: Participant) => p.attributes.userId ?? p.identity.split("-")[0];

export default function VoiceGrid({ room, ...grid }: Omit<ParticipantGridProps, "presence"> & { room: Room }) {
  return (
    <RoomContext.Provider value={room}>
      <RoomAudioRenderer />
      <LivePresence {...grid} />
    </RoomContext.Provider>
  );
}

function LivePresence(grid: Omit<ParticipantGridProps, "presence">) {
  const participants = useParticipants();
  const speakers = useSpeakingParticipants();
  const cameras = useTracks([Track.Source.Camera]).filter(isTrackReference);

  const byUser = new Map(participants.map((p) => [userIdOf(p), p]));
  const presence: Record<string, Presence> = {};
  for (const id of cardIds(grid.campaign)) {
    const p = byUser.get(cardOwnerId(grid.campaign, id));
    if (!p) {
      presence[id] = { offline: true };
      continue;
    }
    const camera = cameras.find((t) => t.participant.identity === p.identity && !t.publication.isMuted);
    presence[id] = {
      speaking: speakers.some((s) => s.identity === p.identity),
      muted: !p.isMicrophoneEnabled,
      video: camera ? <VideoTrack trackRef={camera} /> : undefined,
    };
  }
  return <ParticipantGrid {...grid} presence={presence} />;
}
