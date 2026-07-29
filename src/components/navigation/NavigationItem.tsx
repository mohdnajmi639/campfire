"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ActionTooltip } from "@/components/action-tooltip";

interface NavigationItemProps {
  id: string;
  name: string;
  imageUrl: string;
}

export function NavigationItem({ id, name, imageUrl }: NavigationItemProps) {
  const params = useParams();

  const isActive = params?.serverId === id;

  return (
    <ActionTooltip label={name} side="right" align="center">
      <Link
        href={`/servers/${id}`}
        prefetch={true}
        className="group relative flex items-center"
      >
        {/* Active pill indicator */}
        <div
          className={cn(
            "absolute left-0 w-1 rounded-r-full bg-white transition-all",
            isActive ? "h-9" : "h-0 group-hover:h-5"
          )}
        />

        {/* Server icon */}
        <div
          className={cn(
            "mx-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-[24px] transition-all duration-200 group-hover:rounded-[16px]",
            isActive && "rounded-[16px] bg-campfire-orange/10",
            !imageUrl && "bg-discord-channel"
          )}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              width={48}
              height={48}
              className="object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-discord-text">
              {name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      </Link>
    </ActionTooltip>
  );
}
