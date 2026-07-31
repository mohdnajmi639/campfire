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

    const handleMention = (data: any) => {
      // Play sound
      try {
        const audio = new Audio("/sounds/mention.mp3");
        audio.play().catch(e => console.log("Audio play failed:", e));
      } catch (e) {}

      // Optional: Browser Notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("New Mention", {
          body: `${data.authorName} mentioned you in a message!`,
          icon: "/logo.png"
        });
      } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    };

    pusherClient.bind("user-update", handleUpdate);
    pusherClient.bind("user-mention", handleMention);

    return () => {
      pusherClient.unsubscribe(channelKey);
      pusherClient.unbind("user-update", handleUpdate);
      pusherClient.unbind("user-mention", handleMention);
    };
  }, [userId, router]);

  return null;
}
