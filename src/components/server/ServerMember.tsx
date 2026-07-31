"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MemberRole } from "@/types";
import { UserAvatar } from "@/components/user-avatar";
import { Shield, ShieldCheck, ShieldAlert, MoreVertical, MessageSquare, UserPlus, X, Loader2 } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";
import { ActionTooltip } from "@/components/action-tooltip";
import { getPresenceStatus } from "@/lib/presence";

interface ServerMemberProps {
  member: {
    _id: string;
    role: string;
    nickname?: string;
    user: {
      _id: string;
      name: string;
      image?: string;
      statusText?: string;
      isSuperAdmin?: boolean;
      manualPresence?: "online" | "idle" | "dnd" | "invisible";
      isClientIdle?: boolean;
      lastSeen?: Date;
    };
  };
  serverId: string;
  isCurrentUser?: boolean;
  currentUserRole?: string;
  isFriend?: boolean;
  isViewerSuperAdmin?: boolean;
}

const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.MODERATOR]: (
    <ShieldCheck className="h-4 w-4 text-campfire-orange" />
  ),
  [MemberRole.ADMIN]: <ShieldAlert className="h-4 w-4 text-discord-red" />,
};

export const ServerMember = ({
  member,
  serverId,
  isCurrentUser,
  currentUserRole,
  isFriend,
  isViewerSuperAdmin,
}: ServerMemberProps) => {
  const params = useParams();
  const router = useRouter();
  const { onOpen } = useModal();
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = params?.memberId === member._id;
  const icon = roleIconMap[member.role as MemberRole];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("contextmenu", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("contextmenu", handleClickOutside);
    };
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleAddFriend = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: member.user.name }),
      });
      router.refresh();
      setContextMenu(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKick = async () => {
    try {
      setIsLoading(true);
      await fetch(`/api/members/${member._id}?serverId=${serverId}`, {
        method: "DELETE",
      });
      router.refresh();
      setContextMenu(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const canKick = (currentUserRole === MemberRole.ADMIN && member.role !== MemberRole.ADMIN) || 
                  (currentUserRole === MemberRole.MODERATOR && member.role === MemberRole.GUEST);

  return (
    <>
      <button
        onContextMenu={handleContextMenu}
        className={cn(
          "group flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors relative",
          isActive
            ? "bg-discord-active text-white"
            : "text-discord-muted hover:bg-discord-hover hover:text-discord-text"
        )}
      >
        <UserAvatar
          src={member.user.image}
          name={member.nickname || member.user.name}
          presence={getPresenceStatus(member.user, isViewerSuperAdmin)}
          className="h-7 w-7 shrink-0"
        />
        <div className="flex flex-col text-left flex-1 min-w-0">
          <div className="flex items-center gap-x-1">
            <span className="truncate max-w-[100px]">{member.nickname || member.user.name}</span>
            {icon && (
              <ActionTooltip label={member.role} side="top">
                <span className="flex items-center justify-center shrink-0">{icon}</span>
              </ActionTooltip>
            )}
          </div>
          {member.user.statusText && (
            <span className="text-[11px] text-discord-muted truncate -mt-0.5 max-w-[130px]">
              - {member.user.statusText}
            </span>
          )}
        </div>
        {!isCurrentUser && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e);
            }}
            className="ml-auto hidden items-center justify-center group-hover:flex shrink-0 p-1 rounded hover:bg-discord-dark hover:text-white transition"
          >
            <MoreVertical className="h-4 w-4" />
          </div>
        )}
      </button>

      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 min-w-[180px] rounded-md bg-[#111214] p-2 text-sm text-discord-text shadow-lg ring-1 ring-black/50 space-y-1"
        >
          {isCurrentUser ? (
            <>
              <button
                onClick={() => {
                  setContextMenu(null);
                  onOpen("changeNickname", { member, server: { _id: serverId } });
                }}
                className="w-full rounded-sm px-2 py-1.5 text-left hover:bg-discord-blurple hover:text-white"
              >
                Change Nickname
              </button>
              <button
                onClick={() => {
                  setContextMenu(null);
                  onOpen("userSettings", { user: member.user });
                }}
                className="w-full rounded-sm px-2 py-1.5 text-left hover:bg-discord-blurple hover:text-white"
              >
                Change Status
              </button>
            </>
          ) : (
            <>
              {!isFriend && (
                <button
                  disabled={isLoading}
                  onClick={handleAddFriend}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-campfire-blue hover:text-white disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Friend
                </button>
              )}
              <button
                disabled={isLoading}
                onClick={() => {
                  setContextMenu(null);
                  router.push(`/servers/${serverId}/conversations/${member._id}`);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-discord-blurple hover:text-white disabled:opacity-50"
              >
                <MessageSquare className="h-4 w-4" />
                Message
              </button>
              {canKick && (
                <button
                  disabled={isLoading}
                  onClick={handleKick}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-discord-red hover:bg-discord-red hover:text-white disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Kick Member
                </button>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

