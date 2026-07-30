"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher";

export function UserRealtimeUpdates({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const channelKey = `user-${userId}`;
    pusherClient.subscribe(channelKey);

    const handleUpdate = () => {
      // Refresh Server Components (like NavigationSidebar, DMSidebar)
      router.refresh();
    };

    pusherClient.bind("user-update", handleUpdate);

    return () => {
      pusherClient.unsubscribe(channelKey);
      pusherClient.unbind("user-update", handleUpdate);
    };
  }, [userId, router]);

  return null;
}
