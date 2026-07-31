import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SettingsStore {
  micThreshold: number;
  setMicThreshold: (threshold: number) => void;
  echoCancellation: boolean;
  setEchoCancellation: (enabled: boolean) => void;
  voiceMode: "activity" | "ptt" | "toggle";
  setVoiceMode: (mode: "activity" | "ptt" | "toggle") => void;
  pttKeybind: string;
  setPttKeybind: (key: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      micThreshold: 0.03, // default threshold
      setMicThreshold: (threshold) => set({ micThreshold: threshold }),
      echoCancellation: false, // disabled by default
      setEchoCancellation: (enabled) => set({ echoCancellation: enabled }),
      voiceMode: "activity", // default mode
      setVoiceMode: (mode) => set({ voiceMode: mode }),
      pttKeybind: "KeyV", // default keybind
      setPttKeybind: (key) => set({ pttKeybind: key }),
    }),
    {
      name: "campfire-settings", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), 
    }
  )
);
