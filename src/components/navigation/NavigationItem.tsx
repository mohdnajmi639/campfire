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
  mentionCount?: number;
}

export function NavigationItem({ id, name, imageUrl, mentionCount = 0 }: NavigationItemProps) {
  const params = useParams();

  const isActive = params?.serverId === id;

  return (
    <ActionTooltip label={name} side="right" align="center">
      <Link
        href={`/servers/${id}`}
        prefetch={true}
        className="group relative flex items-center justify-center"
      >
        {/* Active pill indicator */}
        <div
          className={cn(
            "absolute left-0 w-1 rounded-r-full bg-white transition-all",
            isActive ? "h-9" : "h-0 group-hover:h-5"
          )}
        />

        {/* Server icon container */}
        <div className="relative mx-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center overflow-hidden rounded-[24px] transition-all duration-200 group-hover:rounded-[16px]",
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

          {/* Mention Badge */}
          {mentionCount > 0 && (
            <div className="absolute -bottom-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-[3px] border-[#232428] bg-discord-red px-1 text-[11px] font-bold leading-none text-white shadow-sm z-10">
              {mentionCount}
            </div>
          )}
        </div>
      </Link>
    </ActionTooltip>
  );
}
