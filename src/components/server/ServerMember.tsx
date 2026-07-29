"use client";

import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MemberRole } from "@/types";
import { UserAvatar } from "@/components/user-avatar";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";

interface ServerMemberProps {
  member: {
    _id: string;
    role: string;
    user: {
      _id: string;
      name: string;
      image?: string;
    };
  };
  serverId: string;
}

const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.MODERATOR]: (
    <ShieldCheck className="h-4 w-4 text-campfire-orange" />
  ),
  [MemberRole.ADMIN]: <ShieldAlert className="h-4 w-4 text-discord-red" />,
};

export function ServerMember({ member, serverId }: ServerMemberProps) {
  const params = useParams();
  const router = useRouter();

  const isActive = params?.memberId === member._id;
  const icon = roleIconMap[member.role as MemberRole];

  return (
    <button
      onClick={() =>
        router.push(`/servers/${serverId}/conversations/${member._id}`)
      }
      className={cn(
        "group flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
        isActive
          ? "bg-discord-active text-white"
          : "text-discord-muted hover:bg-discord-hover hover:text-discord-text"
      )}
    >
      <UserAvatar
        src={member.user.image}
        name={member.user.name}
        className="h-7 w-7"
      />
      <span className="truncate">{member.user.name}</span>
      {icon && <span className="ml-auto">{icon}</span>}
    </button>
  );
}

