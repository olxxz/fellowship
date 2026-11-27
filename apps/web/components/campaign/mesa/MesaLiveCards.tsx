"use client";

// Carregado sob demanda: só com a pessoa conectada à voz da mesa (o SDK do LiveKit já está baixado).
import { isTrackReference, RoomContext, useParticipants, useSpeakingParticipants, useTracks, VideoTrack } from "@livekit/components-react";
import { Track, type Participant, type Room } from "livekit-client";
import { MesaCards, type MesaSeat, type SeatPresence } from "./MesaCards";

const userIdOf = (p: Participant) => p.attributes.userId ?? p.identity.slice(0, 36);

export default function MesaLiveCards({ room, ...props }: { room: Room; seats: MesaSeat[]; portraits: boolean; meId: string }) {
  return (
    <RoomContext.Provider value={room}>
      <Live {...props} />
    </RoomContext.Provider>
  );
}

function Live({ seats, portraits, meId }: { seats: MesaSeat[]; portraits: boolean; meId: string }) {
  const participants = useParticipants();
  const speakers = useSpeakingParticipants();
  const cameras = useTracks([Track.Source.Camera]).filter(isTrackReference);
  const byUser = new Map(participants.map((p) => [userIdOf(p), p]));
  const presence: Record<string, SeatPresence> = {};
  for (const s of seats) {
    const p = byUser.get(s.userId);
    if (!p) {
      presence[s.userId] = { offline: true };
      continue;
    }
    const camera = cameras.find((t) => t.participant.identity === p.identity && !t.publication.isMuted);
    presence[s.userId] = {
      speaking: speakers.some((x) => x.identity === p.identity),
      muted: !p.isMicrophoneEnabled,
      video: camera ? <VideoTrack trackRef={camera} /> : undefined,
    };
  }
  return <MesaCards seats={seats} presence={presence} portraits={portraits} meId={meId} />;
}
