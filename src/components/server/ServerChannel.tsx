/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MemberRole, ChannelType } from "@/types";
import { useModal } from "@/hooks/use-modal-store";
import { Edit, Lock, Trash, Hash, Mic, Video, MicOff, ScreenShare } from "lucide-react";
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
  currentMember?: {
    _id: string;
    user: { name: string };
  };
  isDefault?: boolean;
  mentionCount?: number;
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
  currentMember,
  isDefault,
  mentionCount = 0,
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
  const canEdit = role === MemberRole.ADMIN || role === MemberRole.MODERATOR;
  const canDelete = !isDefault && (role === MemberRole.ADMIN || role === MemberRole.MODERATOR);

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

  const handleClick = (e: React.MouseEvent) => {
    if (channel.type === ChannelType.AUDIO || channel.type === ChannelType.VIDEO) {
      if (activeVoice?.id !== channel._id) {
        connectVoice({
          id: channel._id,
          name: channel.name,
          serverId: serverId,
          video: channel.type === ChannelType.VIDEO,
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-0.5">
    <Link
      href={`/servers/${serverId}/channels/${channel._id}`}
      prefetch={true}
      onClick={handleClick}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm transition-colors",
        isActive
          ? "bg-discord-active text-white"
          : "text-discord-muted hover:bg-discord-hover hover:text-discord-text"
      )}
    >
        <ActionTooltip label={channel.type === "TEXT" ? "Text Channel" : channel.type === "AUDIO" ? "Voice Channel" : "Video Channel"} side="top" align="start">
          <Icon className="h-4 w-4 shrink-0 outline-none" />
        </ActionTooltip>
      <span className="truncate">{channel.name}</span>

      {mentionCount > 0 && (
        <div className="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-discord-red px-1 text-[10px] font-bold leading-none text-white shadow-sm">
          {mentionCount}
        </div>
      )}

      <div className="ml-auto flex items-center gap-1">
        {(isVoiceConnected || !!status?.sessionStart) && sessionTime && (
          <span className="text-[11px] font-mono font-semibold text-discord-green mr-1">
            {sessionTime}
          </span>
        )}
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && (
            <ActionTooltip label="Edit" side="top">
              <div
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpen("editChannel", { channel, server: { _id: serverId } });
                }}
                className="text-discord-muted hover:text-discord-text"
              >
                <Edit className="h-3.5 w-3.5" />
              </div>
            </ActionTooltip>
          )}
          {canDelete && (
            <ActionTooltip label="Delete" side="top">
              <div
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpen("deleteChannel", { channel, server: { _id: serverId } });
                }}
                className="text-discord-muted hover:text-discord-red"
              >
                <Trash className="h-3.5 w-3.5" />
              </div>
            </ActionTooltip>
          )}
        </div>
      </div>
    </Link>
      {channel.type !== ChannelType.TEXT && (isVoiceConnected || !!status?.sessionStart) && (
        <div className="flex flex-col gap-y-0.5 mt-0.5 relative">
          {(isVoiceConnected && participants.length > 0 ? participants : (status?.participants || [])).map((participant: any) => (
            <ParticipantItem
              key={participant.identity}
              participant={participant}
              serverId={serverId}
              currentMember={currentMember}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ParticipantItem({ participant, serverId, currentMember }: { participant: any, serverId: string, currentMember: any }) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const userVolumes = useVoiceStore((s) => s.userVolumes);
  const setUserVolume = useVoiceStore((s) => s.setUserVolume);
  const { onOpen } = useModal();

  const volume = userVolumes[participant.identity] ?? 1;
  const isCurrentUser = currentMember && participant.identity === currentMember.user.name;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("contextmenu", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("contextmenu", handleClickOutside);
    };
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setUserVolume(participant.identity, val);
  };

  return (
    <div onContextMenu={handleContextMenu}>
      <div className="flex items-center gap-x-2 pl-8 pr-2 py-1 transition-colors hover:bg-discord-hover/50 rounded-sm cursor-pointer">
        <UserAvatar
          src={participant.avatarUrl || ""}
          name={participant.name}
          className={cn(
            "h-6 w-6 transition-all duration-75",
            participant.isSpeaking && "ring-2 ring-green-500"
          )}
        />
        <div className="flex flex-col leading-tight overflow-hidden">
          <span className="text-xs font-semibold text-discord-text truncate">
            {participant.name}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-discord-muted">
          {participant.isScreenSharing && <ScreenShare className="h-3.5 w-3.5 text-campfire-blue" />}
          {participant.isCameraOn && <Video className="h-3.5 w-3.5" />}
          {participant.isMicMuted && <MicOff className="h-3.5 w-3.5 text-discord-red" />}
        </div>
      </div>

      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 min-w-[200px] rounded-md bg-[#111214] p-3 text-sm text-discord-text shadow-lg ring-1 ring-black/50 pointer-events-auto"
        >
          {isCurrentUser ? (
            <button
              onClick={() => {
                setContextMenu(null);
                onOpen("changeNickname", { member: currentMember, server: { _id: serverId } });
              }}
              className="w-full rounded-sm px-2 py-1.5 text-left hover:bg-discord-blurple hover:text-white"
            >
              Change Nickname
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

