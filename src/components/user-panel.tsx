"use client";

import { Settings } from "lucide-react";
import Image from "next/image";
import { ActionTooltip } from "@/components/action-tooltip";
import { useModal } from "@/hooks/use-modal-store";

interface UserPanelProps {
  user: {
    name: string;
    image: string;
  };
}

export function UserPanel({ user }: UserPanelProps) {
  const { onOpen } = useModal();

  return (
    <div className="mt-auto bg-[#232428] p-3 flex items-center justify-between border-t border-discord-dark">
      <div className="flex items-center gap-x-2">
        <div className="relative h-8 w-8 rounded-full overflow-hidden">
          <Image
            fill
            src={user.image || "/placeholder.png"}
            alt={user.name}
            className="object-cover"
          />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-semibold text-white truncate max-w-[100px]">
            {user.name}
          </span>
        </div>
      </div>
      <div className="flex items-center">
        <ActionTooltip label="User Settings">
          <button
            onClick={() => onOpen("userSettings", { user })}
            className="p-2 rounded-md text-discord-muted hover:text-discord-text hover:bg-discord-hover transition"
          >
            <Settings className="h-4 w-4" />
          </button>
        </ActionTooltip>
      </div>
    </div>
  );
}
