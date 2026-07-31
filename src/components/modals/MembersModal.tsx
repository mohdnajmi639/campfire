"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import { MemberRole } from "@/types";
import {
  Loader2,
  MoreVertical,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { ActionTooltip } from "@/components/action-tooltip";
import { getPresenceStatus } from "@/lib/presence";

export function MembersModal() {
  const { isOpen, type, data, onClose } = useModal();
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState("");
  const [activeMenu, setActiveMenu] = useState<{ id: string; x: number; y: number; isBottom: boolean } | null>(null);

  const isModalOpen = isOpen && type === "members";

  useEffect(() => {
    if (isModalOpen && data.server?._id) {
      // Fetch members
      fetch(`/api/servers/${data.server._id}/members`)
        .then((res) => res.json())
        .then((data) => setMembers(data))
        .catch(console.error);
    }
  }, [isModalOpen, data.server?._id]);

  const handleRoleChange = async (memberId: string, role: string) => {
    setLoadingId(memberId);
    try {
      await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, serverId: data.server?._id }),
      });
      setMembers((prev) =>
        prev.map((m) => (m._id === memberId ? { ...m, role } : m))
      );
      setActiveMenu(null);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId("");
    }
  };

  const handleKick = async (memberId: string) => {
    setLoadingId(memberId);
    try {
      await fetch(
        `/api/members/${memberId}?serverId=${data.server?._id}`,
        { method: "DELETE" }
      );
      setMembers((prev) => prev.filter((m) => m._id !== memberId));
      setActiveMenu(null);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId("");
    }
  };

  const roleIcons: Record<string, React.ReactNode> = {
    [MemberRole.ADMIN]: <ActionTooltip label="ADMIN" side="top"><ShieldAlert className="h-4 w-4 text-discord-red" /></ActionTooltip>,
    [MemberRole.MODERATOR]: <ActionTooltip label="MODERATOR" side="top"><ShieldCheck className="h-4 w-4 text-campfire-orange" /></ActionTooltip>,
    [MemberRole.GUEST]: <ActionTooltip label="MEMBER" side="top"><Shield className="h-4 w-4 text-discord-muted" /></ActionTooltip>,
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="w-full max-w-md rounded-lg bg-discord-channel p-6 shadow-2xl animate-scale-in max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Manage Members
            <span className="ml-2 text-sm font-normal text-discord-muted">
              {members.length} members
            </span>
          </h2>
          <button onClick={onClose} className="text-discord-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {members.map((member, index) => {
            const isBottomItem = index >= members.length - 2 && members.length > 2;
            
            return (
            <div
              key={member._id}
              className="flex items-center gap-3 rounded-md p-2 hover:bg-discord-hover transition-colors"
            >
              <UserAvatar
                src={member.userId?.image}
                name={member.userId?.name}
                presence={getPresenceStatus(member.userId || {}, data.user?.isSuperAdmin)}
                className="h-9 w-9"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-discord-text">
                    {member.userId?.name}
                  </span>
                  {roleIcons[member.role]}
                </div>
              </div>

              {member.role !== MemberRole.ADMIN && (
                <div className="relative">
                  {loadingId === member._id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-discord-muted" />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeMenu?.id === member._id) {
                          setActiveMenu(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          // position menu below the button, aligned to the right
                          setActiveMenu({
                            id: member._id,
                            x: rect.right - 192, // 192px = w-48
                            y: rect.bottom + 8,
                            isBottom: index >= members.length - 2 && members.length > 2,
                          });
                        }
                      }}
                      className="rounded-sm p-1 text-discord-muted hover:text-discord-text transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
      
      {/* Render the active menu outside the scrollable container using fixed positioning */}
      {activeMenu && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setActiveMenu(null)} />
          <div
            className={cn(
              "fixed z-[70] w-48 rounded-md bg-discord-darker p-1.5 shadow-xl animate-scale-in pointer-events-auto",
              activeMenu.isBottom ? "origin-bottom-right" : "origin-top-right"
            )}
            style={{ 
              left: activeMenu.x, 
              top: activeMenu.isBottom ? undefined : activeMenu.y,
              bottom: activeMenu.isBottom ? window.innerHeight - activeMenu.y + 32 : undefined 
            }}
          >
            {(() => {
              const member = members.find((m) => m._id === activeMenu.id);
              if (!member) return null;
              return (
                <>
                  <button
                    onClick={() =>
                      handleRoleChange(
                        member._id,
                        member.role === MemberRole.MODERATOR
                          ? MemberRole.GUEST
                          : MemberRole.MODERATOR
                      )
                    }
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-discord-muted hover:bg-campfire-orange hover:text-white transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {member.role === MemberRole.MODERATOR
                      ? "Remove Moderator"
                      : "Make Moderator"}
                  </button>
                  <button
                    onClick={() => handleKick(member._id)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-discord-red hover:bg-discord-red hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Kick Member
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}

