"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Search, Loader2 } from "lucide-react";
import { useRightSidebar } from "@/hooks/use-right-sidebar-store";
import { ChatItem } from "./ChatItem";
interface RightSidebarProps {
  currentMemberId?: string;
  currentMemberRole?: string;
  currentUserId?: string;
}

export function RightSidebar({
  currentMemberId = "",
  currentMemberRole = "GUEST",
  currentUserId = "",
}: RightSidebarProps) {
  const { type, isOpen, data, close, searchQuery } = useRightSidebar();
  
  // To avoid hydration mismatch if needed, though this is purely client-side
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const endpoint = data.channelId ? `/api/channels/${data.channelId}/search` : `/api/conversations/${data.conversationId}/search`;

  const chatId = data.channelId || data.conversationId;

  const { data: queryData, isLoading } = useQuery({
    queryKey: ["search", chatId, searchQuery],
    queryFn: async () => {
      const url = new URL(endpoint, window.location.origin);
      if (searchQuery) {
        url.searchParams.set("q", searchQuery);
      }
      const res = await fetch(url.toString());
      return res.json();
    },
    enabled: isOpen && mounted && (type === "search" && !!searchQuery),
  });

  if (!mounted || !isOpen) return null;

  const messages = queryData?.items || [];

  return (
    <div className="flex w-80 flex-col border-l-2 border-discord-darker/50 bg-[#2B2D31] h-full flex-shrink-0 animate-in slide-in-from-right-8 duration-200">
      <div className="flex h-12 items-center justify-between border-b-2 border-discord-darker/50 px-4 font-semibold text-white shadow-sm">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          <span>Search Results</span>
        </div>
        <button 
          onClick={close}
          className="text-discord-muted hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 space-y-4">
        {isLoading && (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-discord-muted" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center h-32 text-discord-muted space-y-2">
              <>
                <Search className="h-8 w-8 opacity-50" />
                <p className="text-sm">No results found for "{searchQuery}".</p>
              </>
          </div>
        )}

        {!isLoading && messages.map((message: any) => {
          return (
            <div 
              key={message._id} 
              className="bg-discord-channel rounded-md p-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                const element = document.getElementById(`message-${message._id}`);
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "center" });
                  element.classList.add("bg-discord-active/50", "transition-colors", "duration-500");
                  setTimeout(() => {
                    element.classList.remove("bg-discord-active/50");
                  }, 2000);
                }
              }}
            >
              <ChatItem
                id={message._id}
                currentMemberId={currentMemberId}
                currentMemberRole={currentMemberRole}
                currentUserId={currentUserId}
                content={message.content}
                fileUrl={message.fileUrl}
                deleted={message.deleted}
                timestamp={message.createdAt}
                isUpdated={message.updatedAt !== message.createdAt}
                serverId={data.serverId || ""}
                channelId={data.channelId || data.conversationId || ""}
                member={message.memberId}
                type={data.channelId ? "channel" : "conversation"}
                replyTo={message.replyToId}
                mentions={message.mentions}
                actionTooltipSide="left"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
