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

interface VoiceStore {
  isSpeaking: boolean;
  setSpeaking: (speaking: boolean) => void;
  activeVoice: ActiveVoiceChannel | null;
  connectVoice: (channel: ActiveVoiceChannel) => void;
  disconnectVoice: () => void;
  participants: VoiceParticipant[];
  setParticipants: (participants: VoiceParticipant[]) => void;
  isMicMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  setMediaState: (state: Partial<{ isMicMuted: boolean; isCameraOn: boolean; isScreenSharing: boolean }>) => void;
  mediaAction: { type: "mic" | "camera" | "screen"; value: boolean } | null;
  triggerMediaAction: (type: "mic" | "camera" | "screen", value: boolean) => void;
  clearMediaAction: () => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  isSpeaking: false,
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  activeVoice: null,
  connectVoice: (channel) => set({ activeVoice: channel }),
  disconnectVoice: () => set({ activeVoice: null, isSpeaking: false, participants: [], mediaAction: null }),
  participants: [],
  setParticipants: (participants) => set({ participants }),
  isMicMuted: false,
  isCameraOn: false,
  isScreenSharing: false,
  setMediaState: (state) => set(state),
  mediaAction: null,
  triggerMediaAction: (type, value) => set({ mediaAction: { type, value } }),
  clearMediaAction: () => set({ mediaAction: null }),
}));
