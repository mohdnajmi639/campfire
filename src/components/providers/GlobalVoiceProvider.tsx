"use client";

import { useVoiceStore } from "@/hooks/use-voice-store";
import { useParams } from "next/navigation";
import { MediaRoom } from "@/components/media-room";
import { cn } from "@/lib/utils";

export function GlobalVoiceProvider() {
  const { activeVoice } = useVoiceStore();
  const params = useParams();

  if (!activeVoice) return null;

  const isViewingVoice = params?.channelId === activeVoice.id;

  return (
    <div
      className={cn(
        "absolute bottom-0 right-0 z-40 bg-discord-chat flex flex-col transition-all",
        "top-0 md:top-12 left-0 md:left-60",
        !isViewingVoice && "hidden"
      )}
    >
      <MediaRoom
        chatId={activeVoice.id}
        video={activeVoice.video}
        audio={true}
      />
    </div>
  );
}
