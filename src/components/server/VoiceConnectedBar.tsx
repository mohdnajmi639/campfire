"use client";

import { useState, useEffect, useRef } from "react";
import { useVoiceStore } from "@/hooks/use-voice-store";
import { PhoneOff, Radio, Mic, MicOff, Video, VideoOff, MonitorUp } from "lucide-react";
import { ActionTooltip } from "@/components/action-tooltip";
import { cn } from "@/lib/utils";
import { useAudioIndicator } from "@/hooks/use-audio-indicator";
import { useParams, useRouter } from "next/navigation";

export function VoiceConnectedBar() {
  const { activeVoice, disconnectVoice, isMicMuted, isCameraOn, isScreenSharing, triggerMediaAction } = useVoiceStore();
  const { playSound } = useAudioIndicator();
  const [ping, setPing] = useState(24);

  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!activeVoice) return;
    const interval = setInterval(() => {
      // Simulate a highly realistic fluctuating ping between 12ms and 28ms
      setPing(Math.floor(Math.random() * 16) + 12);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeVoice]);

  if (!activeVoice) return null;

  const handleDisconnect = () => {
    playSound("leave");
    disconnectVoice();
    
    // If the user is currently viewing the voice channel page, route them away so they don't instantly reconnect
    if (params?.channelId === activeVoice.id) {
      if (params.serverId) {
        router.push(`/servers/${params.serverId}`);
      } else {
        router.push("/");
      }
    }
  };

  return (
    <div className="mt-auto bg-[#232428] p-3 flex flex-col gap-3 border-t border-discord-dark">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-x-2 overflow-hidden">
          <Radio className="h-4 w-4 text-discord-green shrink-0 animate-pulse" />
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold text-discord-green truncate leading-tight">
              Voice Connected
            </span>
            <span className="text-[11px] text-discord-muted truncate leading-tight mt-0.5">
              {activeVoice.name}
            </span>
          </div>
        </div>

        <ActionTooltip label="Connection Ping">
          <div className="h-10 w-10 flex items-center justify-center rounded-md bg-discord-input text-discord-green shrink-0 cursor-default hover:bg-discord-hover transition-colors">
            <span className="font-mono text-[13px] font-bold tracking-tighter">{ping}ms</span>
          </div>
        </ActionTooltip>
      </div>

      <div className="flex items-center justify-between gap-1.5 mt-2">
        <ActionTooltip label={isMicMuted ? "Unmute" : "Mute"}>
          <button
            onClick={() => {
              playSound(isMicMuted ? "unmute" : "mute");
              triggerMediaAction("mic", isMicMuted);
            }}
            className={cn(
              "h-10 w-10 flex items-center justify-center rounded-md transition-colors shrink-0",
              isMicMuted 
                ? "text-white bg-discord-red hover:bg-discord-red/80" 
                : "text-discord-text bg-discord-input hover:bg-discord-hover"
            )}
          >
            {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        </ActionTooltip>

        <ActionTooltip label={isCameraOn ? "Turn off camera" : "Turn on camera"}>
          <button
            onClick={() => triggerMediaAction("camera", !isCameraOn)}
            className={cn(
              "h-10 w-10 flex items-center justify-center rounded-md transition-colors shrink-0",
              !isCameraOn 
                ? "text-discord-text bg-discord-input hover:bg-discord-hover" 
                : "text-white bg-discord-active hover:bg-discord-hover"
            )}
          >
            {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
        </ActionTooltip>

        <ActionTooltip label={isScreenSharing ? "Stop sharing" : "Share Screen"}>
          <button
            onClick={() => triggerMediaAction("screen", !isScreenSharing)}
            className={cn(
              "h-10 w-10 flex items-center justify-center rounded-md transition-colors shrink-0",
              isScreenSharing 
                ? "text-white bg-discord-green hover:bg-discord-green/80" 
                : "text-discord-text bg-discord-input hover:bg-discord-hover"
            )}
          >
            <MonitorUp className="h-5 w-5" />
          </button>
        </ActionTooltip>

        <ActionTooltip label="Disconnect">
          <button
            onClick={handleDisconnect}
            className="h-10 w-10 flex items-center justify-center rounded-md text-discord-text bg-discord-input hover:text-white hover:bg-discord-red transition-colors shrink-0"
          >
            <PhoneOff className="h-5 w-5 transition-colors" />
          </button>
        </ActionTooltip>
      </div>
    </div>
  );
}
