"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { pusherClient } from "@/lib/pusher";

interface UseChatSocketProps {
  channelId: string;
  queryKey: string;
  serverId?: string; // Add serverId to optionally subscribe to member updates
}

export function useChatSocket({ channelId, queryKey, serverId }: UseChatSocketProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channelKey = `chat-${channelId}`;
    const channel = pusherClient.subscribe(channelKey);

    let serverChannel: any = null;
    if (serverId) {
      serverChannel = pusherClient.subscribe(`server-${serverId}`);
    }

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

      queryClient.invalidateQueries({ queryKey: ["search", channelId] });
    };

    const handleDeleteMessage = (messageId: string) => {
      queryClient.setQueryData([queryKey], (old: any) => {
        if (!old || !old.pages) return old;

        const newPages = old.pages.map((page: any) => ({
          ...page,
          items: page.items.filter((item: any) => item._id !== messageId),
        }));

        return { ...old, pages: newPages };
      });

      queryClient.invalidateQueries({ queryKey: ["search", channelId] });
    };

    const handleMemberUpdate = (member: any) => {
      queryClient.setQueryData([queryKey], (old: any) => {
        if (!old || !old.pages) return old;

        const newPages = old.pages.map((page: any) => ({
          ...page,
          items: page.items.map((item: any) => {
            const updatedItem = { ...item };
            
            // Update message author if it matches
            if (updatedItem.memberId && updatedItem.memberId._id === member._id) {
              updatedItem.memberId = { ...updatedItem.memberId, ...member };
            }

            // Update replied user if it matches
            if (updatedItem.replyToId && updatedItem.replyToId.memberId && updatedItem.replyToId.memberId._id === member._id) {
              updatedItem.replyToId = { 
                ...updatedItem.replyToId, 
                memberId: { ...updatedItem.replyToId.memberId, ...member } 
              };
            }

            return updatedItem;
          }),
        }));

        return { ...old, pages: newPages };
      });
    };

    channel.bind("message:create", handleNewMessage);
    channel.bind("message:update", handleUpdateMessage);
    channel.bind("message:delete", handleDeleteMessage);

    if (serverChannel) {
      serverChannel.bind("member-update", handleMemberUpdate);
    }

    return () => {
      channel.unbind("message:create", handleNewMessage);
      channel.unbind("message:update", handleUpdateMessage);
      channel.unbind("message:delete", handleDeleteMessage);
      pusherClient.unsubscribe(channelKey);

      if (serverChannel) {
        serverChannel.unbind("member-update", handleMemberUpdate);
        pusherClient.unsubscribe(`server-${serverId}`);
      }
    };
  }, [channelId, queryKey, queryClient, serverId]);
}
