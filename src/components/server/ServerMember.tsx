"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MemberRole } from "@/types";
import { UserAvatar } from "@/components/user-avatar";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";
import { ActionTooltip } from "@/components/action-tooltip";

interface ServerMemberProps {
  member: {
    _id: string;
    role: string;
    nickname?: string;
    user: {
      _id: string;
      name: string;
      image?: string;
    };
  };
  serverId: string;
  isCurrentUser?: boolean;
}

const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.MODERATOR]: (
    <ShieldCheck className="h-4 w-4 text-campfire-orange" />
  ),
  [MemberRole.ADMIN]: <ShieldAlert className="h-4 w-4 text-discord-red" />,
};

export function ServerMember({ member, serverId, isCurrentUser }: ServerMemberProps) {
  const params = useParams();
  const router = useRouter();
  const { onOpen } = useModal();
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = params?.memberId === member._id;
  const icon = roleIconMap[member.role as MemberRole];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isCurrentUser) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <>
      <button
        onClick={() => {
          if (!isCurrentUser) {
            router.push(`/servers/${serverId}/conversations/${member._id}`);
          }
        }}
        onContextMenu={handleContextMenu}
        className={cn(
          "group flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
          isActive
            ? "bg-discord-active text-white"
            : "text-discord-muted hover:bg-discord-hover hover:text-discord-text"
        )}
      >
        <UserAvatar
          src={member.user.image}
          name={member.nickname || member.user.name}
          className="h-7 w-7"
        />
        <span className="truncate">{member.nickname || member.user.name}</span>
        {icon && (
          <ActionTooltip label={member.role} side="top">
            <span className="ml-auto flex items-center justify-center">{icon}</span>
          </ActionTooltip>
        )}
      </button>

      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 min-w-[150px] rounded-md bg-[#111214] p-2 text-sm text-discord-text shadow-lg ring-1 ring-black/50"
        >
          <button
            onClick={() => {
              setContextMenu(null);
              onOpen("changeNickname", { member, server: { _id: serverId } });
            }}
            className="w-full rounded-sm px-2 py-1.5 text-left hover:bg-discord-blurple hover:text-white"
          >
            Change Nickname
          </button>
        </div>
      )}
    </>
  );
}

