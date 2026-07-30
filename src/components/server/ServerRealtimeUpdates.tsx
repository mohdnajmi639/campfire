"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher";

export function ServerRealtimeUpdates({ serverId }: { serverId: string }) {
  const router = useRouter();

  useEffect(() => {
    const channelKey = `server-${serverId}`;
    
    pusherClient.subscribe(channelKey);

    const handleUpdate = () => {
      router.refresh();
    };

    pusherClient.bind("member-update", handleUpdate);

    return () => {
      pusherClient.unsubscribe(channelKey);
      pusherClient.unbind("member-update", handleUpdate);
    };
  }, [serverId, router]);

  return null;
}
