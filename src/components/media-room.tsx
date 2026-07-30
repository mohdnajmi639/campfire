"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useAudioIndicator } from "@/hooks/use-audio-indicator";
import { useVoiceStore } from "@/hooks/use-voice-store";
import { Loader2, Maximize } from "lucide-react";
import "@livekit/components-styles";
import {
  LiveKitRoom,
  VideoConference,
  useLocalParticipant,
  useTrackVolume,
  useParticipants,
  useTrackToggle,
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

  const router = useRouter();
  const params = useParams();
  const { playSound } = useAudioIndicator();
  const disconnectVoice = useVoiceStore((s) => s.disconnectVoice);

  useEffect(() => {
    if (!session?.user?.name) return;

    const name = session.user.name;
    const image = session.user.image || "";

    (async () => {
      try {
        const res = await fetch(
          `/api/livekit?room=${chatId}&username=${name}&image=${encodeURIComponent(image)}`
        );
        const data = await res.json();
        setToken(data.token);
      } catch (error) {
        console.error("Failed to get LiveKit token:", error);
      }
    })();
  }, [session?.user, chatId]);

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
      onMediaDeviceFailure={(e) => {
        console.warn("Media device failure (ignored to prevent Next.js crash):", e);
      }}
      onConnected={() => playSound("join")}
      onDisconnected={() => {
        playSound("leave");
        disconnectVoice();
        if (params?.serverId) {
          router.push(`/servers/${params.serverId}`);
        } else {
          router.push("/");
        }
      }}
    >
      <CustomVideoConference />
      <VoiceTracker />
      <VoiceParticipantTracker />
      <MediaStateSync />
    </LiveKitRoom>
  );
}

import { GridLayout, ParticipantTile, useTracks, ControlBar, RoomAudioRenderer, useMaybeTrackRefContext } from "@livekit/components-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

function CustomVideoConference() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const screenShareTracks = tracks.filter((t) => t.source === Track.Source.ScreenShare);
  const focusTrack = screenShareTracks[0];
  const participantSharing = focusTrack?.participant;

  const cameraTracks = tracks.filter(
    (t) => t.source === Track.Source.Camera && t.participant.identity !== participantSharing?.identity
  );

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const elem = document.getElementById("screenshare-container");
    if (elem) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        elem.requestFullscreen();
      }
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-discord-chat">
      <div className="flex-1 overflow-hidden p-2 flex gap-2">
        {focusTrack ? (
          <>
            <div id="screenshare-container" className="flex-1 relative bg-black rounded-lg overflow-hidden group">
              <ParticipantTile trackRef={focusTrack} className="w-full h-full" style={{ width: "100%", height: "100%" }} />
              <button 
                onClick={handleFullscreen}
                className="absolute top-4 right-4 z-50 p-2 bg-black/60 hover:bg-black/80 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize className="h-5 w-5" />
              </button>
            </div>
            {cameraTracks.length > 0 && (
              <div className="w-1/4 max-w-[300px] shrink-0 overflow-y-auto no-scrollbar hidden md:block">
                <GridLayout tracks={cameraTracks} style={{ height: "100%" }}>
                  <CustomParticipantTile />
                </GridLayout>
              </div>
            )}
          </>
        ) : (
          <GridLayout tracks={tracks} style={{ height: "100%", width: "100%" }}>
            <CustomParticipantTile />
          </GridLayout>
        )}
      </div>
      <ControlBar />
      <RoomAudioRenderer />
    </div>
  );
}

function CustomParticipantTile(props: any) {
  const contextTrackRef = useMaybeTrackRefContext();
  const trackRef = props.trackRef || contextTrackRef;

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [volume, setVolume] = useState(1);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  if (!trackRef) return <ParticipantTile {...props} />;

  const participant = trackRef.participant;
  const isSpeaking = participant?.isSpeaking;
  
  // A camera is considered OFF if it's a camera track AND it has no publication (placeholder) OR it is explicitly muted.
  const isCameraOff = trackRef.source === Track.Source.Camera && (!trackRef.publication || trackRef.publication.isMuted);

  let imageUrl = "";
  try {
    const meta = JSON.parse(participant.metadata || "{}");
    imageUrl = meta.image;
  } catch (e) {}

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!participant.isLocal) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    
    // Find audio track and adjust volume
    participant.audioTrackPublications.forEach((pub: any) => {
      if (pub.track && typeof pub.track.setVolume === 'function') {
        pub.track.setVolume(val);
      }
    });
  };

  return (
    <div onContextMenu={handleContextMenu} className="relative w-full h-full">
      <ParticipantTile {...props} trackRef={trackRef} className={cn(props.className, "bg-[#111214]")}>
        {isCameraOff && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <div
              className={cn(
                "relative h-24 w-24 rounded-full flex items-center justify-center bg-discord-active text-discord-text text-3xl font-semibold overflow-hidden transition-all duration-200 pointer-events-auto",
                isSpeaking
                  ? "ring-4 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                  : "ring-4 ring-discord-chat shadow-none"
              )}
            >
              {imageUrl ? (
                <Image
                  fill
                  src={imageUrl}
                  alt={participant.name || participant.identity}
                  className="object-cover"
                />
              ) : (
                <span>{(participant.name || participant.identity || "?")[0].toUpperCase()}</span>
              )}
            </div>
          </div>
        )}
      </ParticipantTile>

      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 min-w-[200px] rounded-md bg-[#111214] p-3 text-sm text-discord-text shadow-lg ring-1 ring-black/50"
        >
          <div className="mb-2 font-semibold text-white">Local Volume</div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-campfire-blue"
            />
            <span className="text-xs w-8 text-right">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaStateSync() {
  const mic = useTrackToggle({ source: Track.Source.Microphone });
  const cam = useTrackToggle({ source: Track.Source.Camera });
  const screen = useTrackToggle({ source: Track.Source.ScreenShare });

  const setMediaState = useVoiceStore((s) => s.setMediaState);
  const mediaAction = useVoiceStore((s) => s.mediaAction);
  const clearMediaAction = useVoiceStore((s) => s.clearMediaAction);
  const { playSound } = useAudioIndicator();
  
  // Track previous mic state to play mute/unmute sounds
  const prevMicRef = useRef(mic.enabled);

  useEffect(() => {
    setMediaState({
      isMicMuted: !mic.enabled,
      isCameraOn: cam.enabled,
      isScreenSharing: screen.enabled,
    });
    
    // Play mute/unmute sound on change
    if (prevMicRef.current !== mic.enabled) {
      if (mic.enabled) {
        playSound("unmute");
      } else {
        playSound("mute");
      }
      prevMicRef.current = mic.enabled;
    }
  }, [mic.enabled, cam.enabled, screen.enabled, setMediaState, playSound]);

  useEffect(() => {
    if (mediaAction) {
      if (mediaAction.type === "mic" && mic.enabled !== mediaAction.value) {
        mic.toggle();
      }
      if (mediaAction.type === "camera" && cam.enabled !== mediaAction.value) {
        cam.toggle();
      }
      if (mediaAction.type === "screen" && screen.enabled !== mediaAction.value) {
        screen.toggle();
      }
      clearMediaAction();
    }
  }, [mediaAction, mic, cam, screen, clearMediaAction]);

  return null;
}

function VoiceParticipantTracker() {
  const participants = useParticipants();
  const setParticipants = useVoiceStore((s) => s.setParticipants);

  useEffect(() => {
    const mapped = participants.map((p) => {
      let imageUrl = "";
      try {
        const meta = JSON.parse(p.metadata || "{}");
        imageUrl = meta.image;
      } catch (e) {}

      return {
        identity: p.identity,
        name: p.name || p.identity,
        isSpeaking: p.isSpeaking,
        avatarUrl: imageUrl,
        joinedAt: p.joinedAt?.getTime(),
      };
    });
    setParticipants(mapped);
  }, [participants, setParticipants]);

  return null;
}

function VoiceTracker() {
  const { localParticipant } = useLocalParticipant();
  const micPub = localParticipant?.getTrackPublication(Track.Source.Microphone);
  const volume = useTrackVolume(micPub as any);
  const setSpeaking = useVoiceStore((s) => s.setSpeaking);

  useEffect(() => {
    const speaking = (volume ?? 0) > 0.02;
    setSpeaking(speaking);
    if (speaking) {
      document.body.classList.add("is-speaking-fast");
    } else {
      document.body.classList.remove("is-speaking-fast");
    }
  }, [volume, setSpeaking]);

  return null;
}
