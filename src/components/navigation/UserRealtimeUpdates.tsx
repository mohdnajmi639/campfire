"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  title: string;
  message: string;
  authorName?: string;
  channelId?: string;
  serverId?: string;
}

export function UserRealtimeUpdates({ userId }: { userId: string }) {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!userId) return;

    const channelKey = `user-${userId}`;
    pusherClient.subscribe(channelKey);

    const handleUpdate = () => {
      // Refresh Server Components (like NavigationSidebar, DMSidebar)
      router.refresh();
    };

    const handleMention = (data: any) => {
      // Play modern chime sound
      try {
        const audio = new Audio("/sounds/mention.wav");
        audio.volume = 0.6;
        audio.play().catch(e => console.log("Audio play failed:", e));
      } catch (e) {}

      // Show in-app toast
      const newToast: Toast = {
        id: Math.random().toString(36).substring(7),
        title: data.isReply ? `${data.authorName} replied to you` : `${data.authorName} mentioned you`,
        message: data.content || "Sent an attachment.",
        authorName: data.authorName,
        channelId: data.channelId,
        serverId: data.serverId,
      };

      setToasts((current) => [...current, newToast]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== newToast.id));
      }, 5000);
    };

    pusherClient.bind("user-update", handleUpdate);
    pusherClient.bind("user-mention", handleMention);

    return () => {
      pusherClient.unsubscribe(channelKey);
      pusherClient.unbind("user-update", handleUpdate);
      pusherClient.unbind("user-mention", handleMention);
    };
  }, [userId, router]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className="flex w-72 items-start gap-x-3 rounded-md bg-discord-channel p-3 shadow-lg border border-discord-darker animate-in slide-in-from-right-8 fade-in duration-300"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-campfire-orange/20">
            <Bell className="h-4 w-4 text-campfire-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-discord-text">{toast.title}</p>
            <p className="text-xs text-discord-muted truncate mt-0.5">{toast.message}</p>
            {toast.serverId && toast.channelId && (
              <button 
                onClick={() => {
                  router.push(`/servers/${toast.serverId}/channels/${toast.channelId}`);
                  setToasts((current) => current.filter((t) => t.id !== toast.id));
                }}
                className="text-[11px] text-campfire-blue hover:underline mt-1"
              >
                Jump to message
              </button>
            )}
          </div>
          <button 
            onClick={() => setToasts((current) => current.filter((t) => t.id !== toast.id))}
            className="text-discord-muted hover:text-discord-text transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
