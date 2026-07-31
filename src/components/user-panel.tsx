"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, Circle, Moon, MinusCircle } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { getPresenceStatus } from "@/lib/presence";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ActionTooltip } from "@/components/action-tooltip";
import { useModal } from "@/hooks/use-modal-store";

interface UserPanelProps {
  user: {
    name: string;
    image: string;
    statusText?: string;
    isSuperAdmin?: boolean;
    manualPresence?: "online" | "idle" | "dnd" | "invisible";
    isClientIdle?: boolean;
    lastSeen?: Date;
  };
}

export function UserPanel({ user }: UserPanelProps) {
  const { onOpen } = useModal();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const presence = getPresenceStatus(user);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleStatusChange = async (status: string) => {
    setIsMenuOpen(false);
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualPresence: status }),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative mt-auto bg-[#232428] p-3 flex items-center justify-between border-t border-discord-dark">
      {isMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute bottom-16 left-2 w-56 rounded-md bg-[#111214] border border-[#1e1f22] p-2 shadow-lg z-50 flex flex-col gap-1"
        >
          <button onClick={() => handleStatusChange("online")} className="flex items-center gap-2 p-2 hover:bg-[#4752C4] rounded-sm transition text-discord-text hover:text-white">
            <div className="h-3 w-3 rounded-full bg-[#23A559]" /> <span className="text-sm font-semibold">Online</span>
          </button>
          <button onClick={() => handleStatusChange("idle")} className="flex items-center gap-2 p-2 hover:bg-[#4752C4] rounded-sm transition text-discord-text hover:text-white">
            <div className="h-3 w-3 rounded-full bg-[#F0B132]" /> <span className="text-sm font-semibold">Idle</span>
          </button>
          <button onClick={() => handleStatusChange("dnd")} className="flex items-center gap-2 p-2 hover:bg-[#4752C4] rounded-sm transition text-discord-text hover:text-white">
            <div className="h-3 w-3 rounded-full bg-[#F23F42] flex items-center justify-center"><div className="w-[6px] h-[2px] bg-[#111214] rounded-sm" /></div> <span className="text-sm font-semibold">Do Not Disturb</span>
          </button>
          <button onClick={() => handleStatusChange("invisible")} className="flex items-center gap-2 p-2 hover:bg-[#4752C4] rounded-sm transition text-discord-text hover:text-white">
            <div className="h-3 w-3 rounded-full bg-gray-500 border-2 border-[#111214]" /> <span className="text-sm font-semibold">Invisible</span>
          </button>
        </div>
      )}
      
      <div 
        className="flex items-center gap-x-2 cursor-pointer hover:bg-white/5 p-1 rounded-md transition"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <UserAvatar 
          src={user.image} 
          name={user.name} 
          presence={presence}
        />
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-semibold text-white truncate max-w-[100px]">
            {user.name}
          </span>
          {user.statusText && (
            <span className="text-[11px] text-discord-muted truncate max-w-[100px]">
              - {user.statusText}
            </span>
          )}
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
