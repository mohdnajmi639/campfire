"use client";

import { useRef, ElementRef } from "react";
import { Loader2, ServerCrash } from "lucide-react";
import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { ChatItem } from "./ChatItem";
import { ChatWelcome } from "./ChatWelcome";

interface ChatMessagesProps {
  name: string;
  chatId: string;
  apiUrl: string;
  paramKey: string;
  paramValue: string;
  type: "channel" | "conversation";
  currentMemberId: string;
  currentMemberRole: string;
  currentUserId?: string;
  serverId: string;
}

export function ChatMessages({
  name,
  chatId,
  apiUrl,
  paramKey,
  paramValue,
  type,
  currentMemberId,
  currentMemberRole,
  currentUserId,
  serverId,
}: ChatMessagesProps) {
  const queryKey = `chat:${chatId}`;
  const chatRef = useRef<ElementRef<"div">>(null);
  const bottomRef = useRef<ElementRef<"div">>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useChatQuery({
      queryKey,
      apiUrl,
      paramKey,
      paramValue,
    });

  useChatSocket({ channelId: chatId, queryKey, serverId });
  useChatScroll({
    chatRef,
    bottomRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
    count: data?.pages?.[0]?.items?.length ?? 0,
  });

  if (status === "pending") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <Loader2 className="my-4 h-7 w-7 animate-spin text-discord-muted" />
        <p className="text-xs text-discord-muted">Loading messages...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <ServerCrash className="my-4 h-7 w-7 text-discord-muted" />
        <p className="text-xs text-discord-muted">Something went wrong!</p>
      </div>
    );
  }

  return (
    <div ref={chatRef} className="flex flex-1 flex-col overflow-y-auto py-4">
      {!hasNextPage && <div className="flex-1" />}
      {!hasNextPage && <ChatWelcome type={type} name={name} />}

      {isFetchingNextPage && (
        <div className="flex justify-center">
          <Loader2 className="my-4 h-6 w-6 animate-spin text-discord-muted" />
        </div>
      )}

      <div className="mt-auto flex flex-col-reverse">
        {data?.pages?.map((page: any, i: number) => (
          <div key={i} className="flex flex-col-reverse">
            {page.items?.map((message: any) => (
              <ChatItem
                key={message._id}
                id={message._id}
                content={message.content}
                member={message.memberId}
                timestamp={message.createdAt}
                fileUrl={message.fileUrl}
                deleted={message.deleted}
                currentMemberId={currentMemberId}
                currentMemberRole={currentMemberRole}
                currentUserId={currentUserId}
                isUpdated={message.createdAt !== message.updatedAt}
                serverId={serverId}
                channelId={chatId}
                type={type}
                replyTo={message.replyToId}
                mentions={message.mentions}
                pinned={message.pinned}
              />
            ))}
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
