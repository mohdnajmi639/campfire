import { useQuery } from "@tanstack/react-query";

export interface GlobalVoiceParticipant {
  identity: string;
  name: string;
  avatarUrl: string;
}

export interface LiveKitStatus {
  sessionStart: number;
  participants: GlobalVoiceParticipant[];
}

export function useLiveKitStatus(serverId: string) {
  return useQuery({
    queryKey: ["livekit-status", serverId],
    queryFn: async () => {
      const res = await fetch(`/api/servers/${serverId}/livekit-status`);
      if (!res.ok) throw new Error("Failed to fetch livekit status");
      return (await res.json()) as Record<string, LiveKitStatus>;
    },
    refetchInterval: 3000, // Poll every 3 seconds
  });
}
