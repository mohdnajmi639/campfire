import { create } from "zustand";

interface MemberData {
  name: string;
  nickname?: string;
  role?: string;
}

interface MemberStore {
  members: Record<string, MemberData>;
  setMembers: (members: Record<string, MemberData>) => void;
  updateMember: (userId: string, data: Partial<MemberData>) => void;
}

export const useMemberStore = create<MemberStore>((set) => ({
  members: {},
  setMembers: (members) => set({ members }),
  updateMember: (userId, data) =>
    set((state) => ({
      members: {
        ...state.members,
        [userId]: {
          ...state.members[userId],
          ...data,
        },
      },
    })),
}));
