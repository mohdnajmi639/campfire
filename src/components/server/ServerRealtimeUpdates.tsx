"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher";
import { useQueryClient } from "@tanstack/react-query";
import { useMemberStore } from "@/hooks/use-member-store";

export function ServerRealtimeUpdates({ 
  serverId, 
  initialMembers 
}: { 
  serverId: string; 
  initialMembers?: any[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return <ServerRealtimeUpdatesInner serverId={serverId} initialMembers={initialMembers} />;
}

function ServerRealtimeUpdatesInner({ 
  serverId, 
  initialMembers 
}: { 
  serverId: string; 
  initialMembers?: any[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setMembers = useMemberStore((state) => state.setMembers);
  const updateMember = useMemberStore((state) => state.updateMember);

  // Initialize store
  useEffect(() => {
    if (initialMembers) {
      const membersMap: Record<string, any> = {};
      initialMembers.forEach((m) => {
        if (m.userId?._id) {
          membersMap[m.userId._id] = {
            name: m.userId.name,
            nickname: m.nickname,
            role: m.role,
          };
        }
      });
      setMembers(membersMap);
    }
  }, [initialMembers, setMembers]);

  useEffect(() => {
    const channelKey = `server-${serverId}`;
    
    pusherClient.subscribe(channelKey);

    const handleUpdate = (updatedMember?: any) => {
      // 1. Refresh Server Components
      router.refresh();

      if (updatedMember && updatedMember.userId) {
        // 2. Update Zustand store for client components (like Voice)
        const userId = typeof updatedMember.userId === "string" ? updatedMember.userId : updatedMember.userId._id;
        
        if (userId) {
          updateMember(userId, {
            nickname: updatedMember.nickname,
            role: updatedMember.role,
          });

          // 3. Update React Query cache for Chat Messages
          queryClient.setQueriesData(
            { predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith("chat:") }, 
            (oldData: any) => {
              if (!oldData || !oldData.pages) return oldData;

            const newPages = oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.map((item: any) => {
                if (item.memberId?._id === updatedMember._id) {
                  return {
                    ...item,
                    memberId: {
                      ...item.memberId,
                      nickname: updatedMember.nickname,
                      role: updatedMember.role,
                    },
                  };
                }
                return item;
              }),
            }));

            return { ...oldData, pages: newPages };
          });
        }
      }
    };

    const handleServerUpdate = () => {
      router.refresh();
    };

    pusherClient.bind("member-update", handleUpdate);
    pusherClient.bind("server-update", handleServerUpdate);

    return () => {
      pusherClient.unsubscribe(channelKey);
      pusherClient.unbind("member-update", handleUpdate);
      pusherClient.unbind("server-update", handleServerUpdate);
    };
  }, [serverId, router, queryClient, updateMember]);

  return null;
}
