"use client";

import { Hash, Mic, Menu, Search } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { SocketIndicator } from "@/components/socket-indicator";
import { ActionTooltip } from "@/components/action-tooltip";
import { useRightSidebar } from "@/hooks/use-right-sidebar-store";
import { useState } from "react";

interface ChatHeaderProps {
  name: string;
  type: "channel" | "conversation";
  channelType?: string;
  imageUrl?: string;
  serverId?: string;
  channelId?: string;
  conversationId?: string;
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
  serverId,
  channelId,
  conversationId,
}: ChatHeaderProps) {
  const Icon = channelType ? iconMap[channelType] : null;
  const { open, close, isOpen, type: sidebarType, setSearchQuery } = useRightSidebar();
  const [localSearch, setLocalSearch] = useState("");



  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localSearch.trim()) {
      if (isOpen && sidebarType === "search") close();
      return;
    }
    setSearchQuery(localSearch);
    open("search", { serverId, channelId, conversationId });
  };

  return (
    <div className="flex h-12 items-center border-b-2 border-discord-darker/50 px-3 font-semibold">
      <div className="flex items-center gap-2">
        {type === "channel" && Icon && (
          <ActionTooltip label={channelType === "TEXT" ? "Text Channel" : "Voice Channel"} side="bottom">
            <Icon className="h-5 w-5 text-discord-muted outline-none" />
          </ActionTooltip>
        )}
        {type === "conversation" && (
          <UserAvatar src={imageUrl} name={name} className="h-7 w-7" />
        )}
        <p className="text-base font-semibold text-white">{name}</p>
      </div>
      <div className="ml-auto flex items-center gap-4 pr-2">


        <form onSubmit={onSearchSubmit} className="relative group">
          <input 
            type="text" 
            placeholder="Search" 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="bg-discord-dark rounded-sm px-2 py-1 text-sm text-discord-text placeholder-discord-muted w-36 focus:w-48 transition-all duration-200 outline-none border-none shadow-none focus:ring-0" 
          />
          <button type="submit" className="absolute right-1 top-1.5 text-discord-muted">
            <Search className="h-4 w-4" />
          </button>
        </form>

        <SocketIndicator isConnected={true} />
      </div>
    </div>
  );
}
