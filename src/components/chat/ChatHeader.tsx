"use client";

import { Hash, Mic, Menu } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { SocketIndicator } from "@/components/socket-indicator";

interface ChatHeaderProps {
  name: string;
  type: "channel" | "conversation";
  channelType?: string;
  imageUrl?: string;
  serverId?: string;
}

const iconMap: Record<string, any> = {
  TEXT: Hash,
  AUDIO: Mic,
};

export function ChatHeader({
  name,
  type,
  channelType,
  imageUrl,
}: ChatHeaderProps) {
  const Icon = channelType ? iconMap[channelType] : null;

  return (
    <div className="flex h-12 items-center border-b-2 border-discord-darker/50 px-3 font-semibold">
      <div className="flex items-center gap-2">
        {type === "channel" && Icon && (
          <Icon className="h-5 w-5 text-discord-muted" />
        )}
        {type === "conversation" && (
          <UserAvatar src={imageUrl} name={name} className="h-7 w-7" />
        )}
        <p className="text-base font-semibold text-white">{name}</p>
      </div>
      <div className="ml-auto flex items-center">
        <SocketIndicator isConnected={true} />
      </div>
    </div>
  );
}
