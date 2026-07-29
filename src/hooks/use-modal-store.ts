import { create } from "zustand";
import { ChannelType } from "@/models/Channel";

export type ModalType =
  | "createServer"
  | "editServer"
  | "deleteServer"
  | "leaveServer"
  | "invite"
  | "members"
  | "createChannel"
  | "editChannel"
  | "deleteChannel"
  | "messageFile"
  | "deleteMessage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ModalData {
  server?: any;
  channel?: any;
  channelType?: ChannelType;
  apiUrl?: string;
  query?: Record<string, string>;
}

interface ModalStore {
  type: ModalType | null;
  isOpen: boolean;
  data: ModalData;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  isOpen: false,
  data: {},
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
}));
