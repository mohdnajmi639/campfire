"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import "@livekit/components-styles";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";

interface MediaRoomProps {
  chatId: string;
  video: boolean;
  audio: boolean;
}

export function MediaRoom({ chatId, video, audio }: MediaRoomProps) {
  const { data: session } = useSession();
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!session?.user?.name) return;

    const name = session.user.name;

    (async () => {
      try {
        const res = await fetch(
          `/api/livekit?room=${chatId}&username=${name}`
        );
        const data = await res.json();
        setToken(data.token);
      } catch (error) {
        console.error("Failed to get LiveKit token:", error);
      }
    })();
  }, [session?.user?.name, chatId]);

  if (!token) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <Loader2 className="my-4 h-7 w-7 animate-spin text-discord-muted" />
        <p className="text-xs text-discord-muted">Connecting to voice...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      data-lk-theme="default"
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={true}
      video={video}
      audio={audio}
      className="flex-1"
    >
      <RoomContent />
      <RoomAudioRenderer />
      <div className="flex justify-center p-4">
        <ControlBar />
      </div>
    </LiveKitRoom>
  );
}

function RoomContent() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <GridLayout
      tracks={tracks}
      className="flex-1"
      style={{ height: "calc(100vh - 12rem)" }}
    >
      <ParticipantTile />
    </GridLayout>
  );
}
