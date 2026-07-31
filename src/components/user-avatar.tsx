"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { PresenceIndicator } from "@/components/presence-indicator";

interface UserAvatarProps {
  src?: string;
  name?: string;
  className?: string;
  presence?: "online" | "idle" | "dnd" | "invisible" | "offline";
}

export function UserAvatar({ src, name, className, presence }: UserAvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-discord-active text-xs font-semibold text-discord-text overflow-hidden",
          className
        )}
      >
        {src ? (
          <Image src={src} alt={name || "Avatar"} fill className="object-cover" sizes="32px" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {presence && <PresenceIndicator status={presence} />}
    </div>
  );
}
