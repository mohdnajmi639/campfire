import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SettingsStore {
  micThreshold: number;
  setMicThreshold: (threshold: number) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      micThreshold: 0.03, // default threshold
      setMicThreshold: (threshold) => set({ micThreshold: threshold }),
    }),
    {
      name: "campfire-settings", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), 
    }
  )
);
