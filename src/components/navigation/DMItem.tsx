"use client";

import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";

interface DMItemProps {
  id: string;
  name: string;
  imageUrl: string;
}

export function DMItem({ id, name, imageUrl }: DMItemProps) {
  const params = useParams();
  const router = useRouter();

  const isActive = params?.conversationId === id;

  const onClick = () => {
    router.push(`/me/${id}`);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "group mb-1 flex w-full items-center gap-x-2 rounded-md px-2 py-2 transition hover:bg-discord-hover",
        isActive && "bg-discord-active"
      )}
    >
      <UserAvatar
        src={imageUrl}
        name={name}
        className="h-8 w-8"
      />
      <p
        className={cn(
          "truncate text-sm font-semibold transition group-hover:text-discord-text",
          isActive ? "text-discord-text" : "text-discord-muted"
        )}
      >
        {name}
      </p>
    </button>
  );
}
