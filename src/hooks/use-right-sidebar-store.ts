import { create } from "zustand";

export type RightSidebarType = "search" | null;

interface RightSidebarData {
  channelId?: string;
  conversationId?: string;
  serverId?: string;
  apiUrl?: string;
}

interface RightSidebarStore {
  type: RightSidebarType;
  isOpen: boolean;
  data: RightSidebarData;
  searchQuery: string;
  open: (type: RightSidebarType, data?: RightSidebarData) => void;
  close: () => void;
  setSearchQuery: (query: string) => void;
}

export const useRightSidebar = create<RightSidebarStore>((set) => ({
  type: null,
  isOpen: false,
  data: {},
  searchQuery: "",
  open: (type, data = {}) => set({ isOpen: true, type, data }),
  close: () => set({ isOpen: false, type: null, data: {}, searchQuery: "" }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
