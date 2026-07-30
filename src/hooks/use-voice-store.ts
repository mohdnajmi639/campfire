import { create } from "zustand";

export interface ActiveVoiceChannel {
  id: string;
  name: string;
  serverId: string;
  video: boolean;
}

export interface VoiceParticipant {
  identity: string;
  name: string;
  isSpeaking: boolean;
  avatarUrl?: string;
  joinedAt?: number;
}

export interface VoiceState {
  isMicMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
}

interface VoiceStore extends VoiceState {
  activeVoice: ActiveVoiceChannel | null;
  isSpeaking: boolean;
  participants: VoiceParticipant[];
  mediaAction: { type: "mic" | "camera" | "screen"; value: boolean } | null;
  userVolumes: Record<string, number>;

  connectVoice: (channel: ActiveVoiceChannel) => void;
  disconnectVoice: () => void;
  setSpeaking: (speaking: boolean) => void;
  setParticipants: (participants: VoiceParticipant[]) => void;
  setMediaState: (state: Partial<VoiceState>) => void;
  triggerMediaAction: (action: "mic" | "camera" | "screen", value: boolean) => void;
  clearMediaAction: () => void;
  setUserVolume: (identity: string, volume: number) => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  activeVoice: null,
  isSpeaking: false,
  participants: [],
  isMicMuted: false,
  isCameraOn: false,
  isScreenSharing: false,
  mediaAction: null,
  userVolumes: {},

  connectVoice: (channel) => set({ activeVoice: channel }),
  disconnectVoice: () => set({ activeVoice: null, participants: [], isSpeaking: false, userVolumes: {} }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setParticipants: (participants) => set({ participants }),
  setMediaState: (state) => set((prev) => ({ ...prev, ...state })),
  triggerMediaAction: (type, value) => set({ mediaAction: { type, value } }),
  clearMediaAction: () => set({ mediaAction: null }),
  setUserVolume: (identity, volume) => set((prev) => ({
    userVolumes: { ...prev.userVolumes, [identity]: volume }
  })),
}));
