"use client";

import { useState } from "react";
import { MemberRole } from "@/types";
import { ChannelType } from "@/types";
import { useModal } from "@/hooks/use-modal-store";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServerSectionProps {
  label: string;
  role?: string;
  channelType?: ChannelType;
  serverId: string;
  children: React.ReactNode;
}

export function ServerSection({
  label,
  role,
  channelType,
  serverId,
  children,
}: ServerSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { onOpen } = useModal();

  const canManage =
    role === MemberRole.ADMIN || role === MemberRole.MODERATOR;

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-1 py-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-0.5 text-xs font-semibold uppercase tracking-wide text-discord-muted hover:text-discord-text transition-colors"
        >
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              isCollapsed && "-rotate-90"
            )}
          />
          {label}
        </button>
        {canManage && channelType && (
          <button
            onClick={() =>
              onOpen("createChannel", {
                channelType,
                server: { _id: serverId },
              })
            }
            className="text-discord-muted hover:text-discord-text transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
      {!isCollapsed && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

