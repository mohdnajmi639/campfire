import { create } from "zustand";

interface ReplyData {
  messageId: string;
  memberId: string;
  name: string;
}

interface ReplyStore {
  reply: ReplyData | null;
  setReply: (data: ReplyData) => void;
  clearReply: () => void;
}

export const useReplyStore = create<ReplyStore>((set) => ({
  reply: null,
  setReply: (data: ReplyData) => set({ reply: data }),
  clearReply: () => set({ reply: null }),
}));
