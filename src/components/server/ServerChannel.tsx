"use client";

import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MemberRole } from "@/models/Member";
import { useModal } from "@/hooks/use-modal-store";
import { Edit, Lock, Trash, type LucideIcon } from "lucide-react";
import { ActionTooltip } from "@/components/action-tooltip";

interface ServerChannelProps {
  channel: {
    _id: string;
    name: string;
    type: string;
  };
  serverId: string;
  role?: string;
  Icon: LucideIcon;
}

export function ServerChannel({
  channel,
  serverId,
  role,
  Icon,
}: ServerChannelProps) {
  const params = useParams();
  const router = useRouter();
  const { onOpen } = useModal();

  const isActive = params?.channelId === channel._id;
  const isGeneral = channel.name === "general";
  const canManage =
    !isGeneral &&
    (role === MemberRole.ADMIN || role === MemberRole.MODERATOR);

  const handleClick = () => {
    router.push(`/servers/${serverId}/channels/${channel._id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm transition-colors",
        isActive
          ? "bg-discord-active text-white"
          : "text-discord-muted hover:bg-discord-hover hover:text-discord-text"
      )}
    >
      {isGeneral ? (
        <Lock className="h-4 w-4 shrink-0 text-discord-muted" />
      ) : (
        <Icon className="h-4 w-4 shrink-0" />
      )}
      <span className="truncate">{channel.name}</span>

      {canManage && (
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionTooltip label="Edit" side="top">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen("editChannel", { channel, server: { _id: serverId } });
              }}
              className="text-discord-muted hover:text-discord-text"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          </ActionTooltip>
          <ActionTooltip label="Delete" side="top">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen("deleteChannel", { channel, server: { _id: serverId } });
              }}
              className="text-discord-muted hover:text-discord-red"
            >
              <Trash className="h-3.5 w-3.5" />
            </button>
          </ActionTooltip>
        </div>
      )}
    </button>
  );
}
