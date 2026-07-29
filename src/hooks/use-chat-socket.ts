"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { pusherClient } from "@/lib/pusher";

interface UseChatSocketProps {
  channelId: string;
  queryKey: string;
}

export function useChatSocket({ channelId, queryKey }: UseChatSocketProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channelKey = `chat-${channelId}`;
    const channel = pusherClient.subscribe(channelKey);

    const handleNewMessage = (message: any) => {
      queryClient.setQueryData([queryKey], (old: any) => {
        if (!old || !old.pages || old.pages.length === 0) {
          return {
            pages: [{ items: [message], nextCursor: null }],
            pageParams: [undefined],
          };
        }

        const newPages = [...old.pages];
        newPages[0] = {
          ...newPages[0],
          items: [message, ...newPages[0].items],
        };

        return { ...old, pages: newPages };
      });
    };

    const handleUpdateMessage = (message: any) => {
      queryClient.setQueryData([queryKey], (old: any) => {
        if (!old || !old.pages) return old;

        const newPages = old.pages.map((page: any) => ({
          ...page,
          items: page.items.map((item: any) =>
            item._id === message._id ? message : item
          ),
        }));

        return { ...old, pages: newPages };
      });
    };

    channel.bind("message:create", handleNewMessage);
    channel.bind("message:update", handleUpdateMessage);

    return () => {
      channel.unbind("message:create", handleNewMessage);
      channel.unbind("message:update", handleUpdateMessage);
      pusherClient.unsubscribe(channelKey);
    };
  }, [channelId, queryKey, queryClient]);
}
