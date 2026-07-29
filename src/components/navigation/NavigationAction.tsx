"use client";

import { Plus } from "lucide-react";
import { ActionTooltip } from "@/components/action-tooltip";
import { useModal } from "@/hooks/use-modal-store";

export function NavigationAction() {
  const { onOpen } = useModal();

  return (
    <ActionTooltip label="Add a server" side="right" align="center">
      <button
        onClick={() => onOpen("createServer")}
        className="group flex items-center"
      >
        <div className="mx-3 flex h-12 w-12 items-center justify-center rounded-[24px] bg-discord-channel transition-all duration-200 group-hover:rounded-[16px] group-hover:bg-discord-green">
          <Plus className="h-6 w-6 text-discord-green transition-colors group-hover:text-white" />
        </div>
      </button>
    </ActionTooltip>
  );
}
