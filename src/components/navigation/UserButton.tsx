"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { ActionTooltip } from "@/components/action-tooltip";

interface UserButtonProps {
  name: string;
  image?: string;
}

export function UserButton({ name, image }: UserButtonProps) {
  return (
    <div className="flex flex-col items-center gap-y-2">
      <ActionTooltip label={name} side="right">
        <div className="cursor-pointer">
          <UserAvatar src={image} name={name} className="h-10 w-10" />
        </div>
      </ActionTooltip>
      <ActionTooltip label="Log out" side="right">
        <button
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          className="flex h-10 w-10 items-center justify-center rounded-full text-discord-muted transition-colors hover:text-discord-red"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </ActionTooltip>
    </div>
  );
}
