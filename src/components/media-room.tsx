"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useAudioIndicator } from "@/hooks/use-audio-indicator";
import { useVoiceStore } from "@/hooks/use-voice-store";
import { useMemberStore } from "@/hooks/use-member-store";
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
  const echoCancellation = useSettingsStore((s) => s.echoCancellation);

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
      audio={audio ? { echoCancellation, noiseSuppression: true, autoGainControl: true } : false}
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
      <VoiceKeybindListener />
      <VolumeSync />
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

  const voiceMode = useSettingsStore((s) => s.voiceMode);

  return (
    <div className="flex flex-col h-full relative bg-discord-chat">
      <div className="flex-1 overflow-hidden p-2 flex gap-2 pb-16">
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
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 w-full flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <ControlBar controls={{ camera: true, microphone: voiceMode !== "ptt", screenShare: true, leave: true }} />
        </div>
      </div>
      <RoomAudioRenderer />
    </div>
  );
}

function VolumeSync() {
  const participants = useParticipants();
  const userVolumes = useVoiceStore((s) => s.userVolumes);

  useEffect(() => {
    participants.forEach((p) => {
      const vol = userVolumes[p.identity] ?? 1;
      p.audioTrackPublications.forEach((pub: any) => {
        if (pub.track && typeof pub.track.setVolume === 'function') {
          pub.track.setVolume(vol);
        }
      });
    });
  }, [participants, userVolumes]);
  
  return null;
}

function CustomParticipantTile(props: any) {
  const contextTrackRef = useMaybeTrackRefContext();
  const trackRef = props.trackRef || contextTrackRef;

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const userVolumes = useVoiceStore((s) => s.userVolumes);
  const setUserVolume = useVoiceStore((s) => s.setUserVolume);
  const membersStore = useMemberStore((state) => state.members);
  const voiceMode = useSettingsStore((s) => s.voiceMode);

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
  const localIsSpeaking = useVoiceStore((s) => s.isSpeaking);
  const isSpeaking = participant?.isLocal ? localIsSpeaking : participant?.isSpeaking;
  const volume = userVolumes[participant.identity] ?? 1;
  
  const memberData = Object.values(membersStore).find((m) => m.name === participant.identity);
  const displayName = memberData?.nickname || memberData?.name || participant.name || participant.identity;
  
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
    setUserVolume(participant.identity, val);
  };

  return (
    <div onContextMenu={handleContextMenu} className="relative w-full h-full bg-[#111214] rounded-lg overflow-hidden group">
      <ParticipantTile {...props} trackRef={trackRef} className="w-full h-full absolute inset-0" />
      
      {isCameraOff && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#111214] pointer-events-none">
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
                alt={displayName}
                className="object-cover"
              />
            ) : (
              <span>{(displayName || "?")[0].toUpperCase()}</span>
            )}
          </div>
        </div>
      )}

      {/* Always render custom name tag for consistency (hiding LiveKit's default via CSS) */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-sm font-semibold text-white pointer-events-none z-10">
        {(!participant.isMicrophoneEnabled && !(participant.isLocal && voiceMode === 'ptt')) && (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><line x1="2" y1="2" x2="22" y2="22"></line><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"></path><path d="M5 10v2a7 7 0 0 0 12 5l-1.5-1.5a5 5 0 0 1-9-3.5v-2"></path><path d="M9.86 4.14A3 3 0 0 1 15 7v4.86l-5-5Z"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
        )}
        <span className="max-w-[150px] truncate">{displayName}</span>
      </div>

      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 min-w-[200px] rounded-md bg-[#111214] p-3 text-sm text-discord-text shadow-lg ring-1 ring-black/50 pointer-events-auto"
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
  const voiceMode = useSettingsStore((s) => s.voiceMode);
  
  // Track previous mic state to play mute/unmute sounds
  const prevMicRef = useRef(mic.enabled);

  useEffect(() => {
    setMediaState({
      isMicMuted: voiceMode === "ptt" ? false : !mic.enabled,
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

function VoiceKeybindListener() {
  const voiceMode = useSettingsStore((s) => s.voiceMode);
  const pttKeybind = useSettingsStore((s) => s.pttKeybind);
  const mic = useTrackToggle({ source: Track.Source.Microphone });
  const isKeyPressedRef = useRef(false);

  // Initialize PTT state (always start muted if PTT)
  useEffect(() => {
    if (voiceMode === "ptt" && mic.enabled) {
      mic.toggle();
    }
  }, [voiceMode]); // only run when voiceMode changes or mounts

  useEffect(() => {
    if (voiceMode === "activity") return;
    if (!pttKeybind) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.code === pttKeybind) {
        // Prevent default action (e.g. Space scrolling)
        e.preventDefault();
        
        if (!isKeyPressedRef.current) {
          isKeyPressedRef.current = true;
          if (voiceMode === "ptt") {
            if (!mic.enabled) mic.toggle();
          } else if (voiceMode === "toggle") {
            mic.toggle();
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === pttKeybind) {
        isKeyPressedRef.current = false;
        if (voiceMode === "ptt") {
          if (mic.enabled) mic.toggle();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [voiceMode, pttKeybind, mic.enabled]);

  return null;
}

function VoiceParticipantTracker() {
  const participants = useParticipants();
  const setParticipants = useVoiceStore((s) => s.setParticipants);
  const membersStore = useMemberStore((state) => state.members);
  const localIsSpeaking = useVoiceStore((s) => s.isSpeaking);
  const voiceMode = useSettingsStore((s) => s.voiceMode);

  useEffect(() => {
    const mapped = participants.map((p) => {
      let imageUrl = "";
      try {
        const meta = JSON.parse(p.metadata || "{}");
        imageUrl = meta.image;
      } catch (e) {}
      
      const memberData = Object.values(membersStore).find((m) => m.name === p.identity);
      const displayName = memberData?.nickname || memberData?.name || p.name || p.identity;

      return {
        identity: p.identity,
        name: displayName,
        isSpeaking: p.isLocal ? localIsSpeaking : p.isSpeaking,
        avatarUrl: imageUrl,
        joinedAt: p.joinedAt?.getTime(),
        isMicMuted: p.isLocal && voiceMode === "ptt" ? false : !p.isMicrophoneEnabled,
        isCameraOn: p.isCameraEnabled,
        isScreenSharing: p.isScreenShareEnabled,
      };
    });
    setParticipants(mapped);
  }, [participants, setParticipants, membersStore, localIsSpeaking, voiceMode]);

  return null;
}

import { useSettingsStore } from "@/hooks/use-settings-store";

function VoiceTracker() {
  const { localParticipant } = useLocalParticipant();
  const micPub = localParticipant?.getTrackPublication(Track.Source.Microphone);
  const track = micPub?.track;
  const volume = useTrackVolume(track as any);
  const setSpeaking = useVoiceStore((s) => s.setSpeaking);
  const micThreshold = useSettingsStore((s) => s.micThreshold);

  useEffect(() => {
    // Uses the user's custom threshold from settings
    const speaking = (volume ?? 0) > micThreshold;
    setSpeaking(speaking);
    if (speaking) {
      document.body.classList.add("is-speaking-fast");
    } else {
      document.body.classList.remove("is-speaking-fast");
    }
  }, [volume, setSpeaking]);

  return null;
}
