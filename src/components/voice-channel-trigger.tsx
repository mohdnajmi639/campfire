"use client";

import { useEffect, useRef } from "react";
import { useVoiceStore, ActiveVoiceChannel } from "@/hooks/use-voice-store";

interface VoiceChannelTriggerProps {
  channel: ActiveVoiceChannel;
}

export function VoiceChannelTrigger({ channel }: VoiceChannelTriggerProps) {
  const { connectVoice, activeVoice } = useVoiceStore();
  const lastConnectedChannelId = useRef<string | null>(null);

  useEffect(() => {
    // Only connect if we haven't handled this specific channel yet
    if (lastConnectedChannelId.current !== channel.id) {
      if (activeVoice?.id !== channel.id) {
        connectVoice(channel);
      }
      // Mark as handled so we don't reconnect if activeVoice becomes null (e.g. when leaving)
      lastConnectedChannelId.current = channel.id;
    }
  }, [channel, activeVoice?.id, connectVoice]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-discord-chat">
      {/* Background placeholder while global provider overlays the UI */}
    </div>
  );
}
