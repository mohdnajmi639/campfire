"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MemberRole, ChannelType } from "@/types";
import { useModal } from "@/hooks/use-modal-store";
import { Edit, Lock, Trash, Hash, Mic, Video } from "lucide-react";
import { ActionTooltip } from "@/components/action-tooltip";
import { UserAvatar } from "@/components/user-avatar";
import { useLiveKitStatus } from "@/hooks/use-livekit-status";

import { useVoiceStore } from "@/hooks/use-voice-store";

interface ServerChannelProps {
  channel: {
    _id: string;
    name: string;
    type: string;
  };
  serverId: string;
  role?: string;
}

const iconMap = {
  [ChannelType.TEXT]: Hash,
  [ChannelType.AUDIO]: Mic,
  [ChannelType.VIDEO]: Video,
};

export function ServerChannel({
  channel,
  serverId,
  role,
}: ServerChannelProps) {
  const params = useParams();
  const router = useRouter();
  const { onOpen } = useModal();
  const isSpeaking = useVoiceStore((s) => s.isSpeaking);
  const activeVoice = useVoiceStore((s) => s.activeVoice);
  const connectVoice = useVoiceStore((s) => s.connectVoice);
  const participants = useVoiceStore((s) => s.participants);
  
  const { data: liveKitStatus } = useLiveKitStatus(serverId);
  const status = liveKitStatus?.[channel._id];

  const Icon = iconMap[channel.type as ChannelType];

  const [sessionTime, setSessionTime] = useState("");
  const startTimeRef = useRef<number | null>(null);

  const isActive = params?.channelId === channel._id;
  const isVoiceConnected = activeVoice?.id === channel._id;
  const isGeneral = channel.name === "general";
  const canManage =
    !isGeneral &&
    (role === MemberRole.ADMIN || role === MemberRole.MODERATOR);

  useEffect(() => {
    if (isVoiceConnected && participants.length > 0) {
      const joinedTimes = participants.map(p => p.joinedAt).filter(Boolean) as number[];
      if (joinedTimes.length > 0) {
        startTimeRef.current = Math.min(...joinedTimes);
      }
    } else if (status?.sessionStart) {
      startTimeRef.current = status.sessionStart;
    } else {
      startTimeRef.current = null;
      setSessionTime("");
    }
  }, [isVoiceConnected, participants, status?.sessionStart]);

  useEffect(() => {
    const hasActiveSession = isVoiceConnected || !!status?.sessionStart;
    if (!hasActiveSession) {
      setSessionTime("");
      return;
    }
    
    const timerInterval = setInterval(() => {
      if (!startTimeRef.current) return;
      const diff = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
      const hours = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      
      if (hours > 0) {
        setSessionTime(`${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      } else {
        setSessionTime(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [isVoiceConnected, status?.sessionStart]);

  const handleClick = () => {
    if (channel.type === ChannelType.AUDIO) {
      if (activeVoice?.id !== channel._id) {
        // Connect in the background without switching pages
        connectVoice({
          id: channel._id,
          name: channel.name,
          serverId: serverId,
          video: false,
        });
        return;
      }
      // If already connected, a second click takes them to the full screen UI
      router.push(`/servers/${serverId}/channels/${channel._id}`);
    } else {
      router.push(`/servers/${serverId}/channels/${channel._id}`);
    }
  };

  return (
    <div className="flex flex-col gap-0.5">
    <button
      onClick={handleClick}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm transition-colors",
        isActive
          ? "bg-discord-active text-white"
          : "text-discord-muted hover:bg-discord-hover hover:text-discord-text"
      )}
    >
      {isGeneral ? (
        <Lock className="h-4 w-4 shrink-0 text-discord-muted" />
      ) : (
        <Icon className="h-4 w-4 shrink-0" />
      )}
      <span className="truncate">{channel.name}</span>

      <div className="ml-auto flex items-center gap-1">
        {(isVoiceConnected || !!status?.sessionStart) && sessionTime && (
          <span className="text-[11px] font-mono font-semibold text-discord-green mr-1">
            {sessionTime}
          </span>
        )}
        
        {canManage && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionTooltip label="Edit" side="top">
              <div
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen("editChannel", { channel, server: { _id: serverId } });
                }}
                className="text-discord-muted hover:text-discord-text"
              >
                <Edit className="h-3.5 w-3.5" />
              </div>
            </ActionTooltip>
            <ActionTooltip label="Delete" side="top">
              <div
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen("deleteChannel", { channel, server: { _id: serverId } });
                }}
                className="text-discord-muted hover:text-discord-red"
              >
                <Trash className="h-3.5 w-3.5" />
              </div>
            </ActionTooltip>
          </div>
        )}
      </div>
    </button>
      {channel.type !== ChannelType.TEXT && (isVoiceConnected || !!status?.sessionStart) && (
        <div className="flex flex-col gap-y-0.5 mt-0.5">
          {(isVoiceConnected && participants.length > 0 ? participants : (status?.participants || [])).map((participant: any) => (
            <div
              key={participant.identity}
              className="flex items-center gap-x-2 pl-8 pr-2 py-1 transition-colors hover:bg-discord-hover/50 rounded-sm"
            >
              <UserAvatar
                src={participant.avatarUrl || ""}
                name={participant.name}
                className={cn(
                  "h-6 w-6 transition-all duration-75",
                  participant.isSpeaking && "ring-2 ring-discord-blue"
                )}
              />
              <div className="flex flex-col leading-tight overflow-hidden">
                <span className="text-xs font-semibold text-discord-text truncate">
                  {participant.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

