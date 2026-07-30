"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Edit, FileIcon, Trash, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { ActionTooltip } from "@/components/action-tooltip";
import { MemberRole } from "@/types";

import { useModal } from "@/hooks/use-modal-store";

interface ChatItemProps {
  id: string;
  content: string;
  member: {
    _id: string;
    role: string;
    userId: {
      _id: string;
      name: string;
      image?: string;
    };
  };
  timestamp: string;
  fileUrl?: string;
  deleted: boolean;
  currentMemberId: string;
  currentMemberRole: string;
  isUpdated: boolean;
  serverId: string;
  channelId: string;
}

const roleIconMap: Record<string, React.ReactNode> = {
  [MemberRole.ADMIN]: <ShieldAlert className="h-4 w-4 text-discord-red" />,
  [MemberRole.MODERATOR]: <ShieldCheck className="h-4 w-4 text-campfire-orange" />,
  [MemberRole.GUEST]: null,
};

const DATE_FORMAT = "d MMM yyyy, HH:mm";

export function ChatItem({
  id,
  content,
  member,
  timestamp,
  fileUrl,
  deleted,
  currentMemberId,
  currentMemberRole,
  isUpdated,
  serverId,
  channelId,
}: ChatItemProps) {
  const { onOpen } = useModal();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isLoading, setIsLoading] = useState(false);

  const fileType = fileUrl?.split(".").pop();
  const isImage = fileUrl && fileType !== "pdf";
  const isPDF = fileUrl && fileType === "pdf";

  const isOwner = member._id === currentMemberId;
  const isAdmin = currentMemberRole === MemberRole.ADMIN;
  const isModerator = currentMemberRole === MemberRole.MODERATOR;
  const canDelete = !deleted && (isOwner || isAdmin || isModerator);
  const canEdit = !deleted && isOwner && !fileUrl;

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === content) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent, serverId, channelId }),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(
        `/api/messages/${id}?serverId=${serverId}&channelId=${channelId}`,
        { method: "DELETE" }
      );
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  return (
    <div className="group relative flex items-start gap-x-3 px-4 py-1.5 chat-item-hover transition-colors">
      {/* Avatar */}
      <UserAvatar
        src={member.userId?.image}
        name={member.userId?.name}
        className="mt-0.5 h-9 w-9 cursor-pointer"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-x-2">
          <span className="text-sm font-semibold text-discord-text hover:underline cursor-pointer">
            {member.userId?.name}
          </span>
          {roleIconMap[member.role] && (
            <ActionTooltip label={member.role} side="top">
              <span className="text-xs flex items-center justify-center">{roleIconMap[member.role]}</span>
            </ActionTooltip>
          )}
          <span className="text-xs text-discord-muted">
            {format(new Date(timestamp), DATE_FORMAT)}
          </span>
        </div>

        {/* Image */}
        {isImage && (
          <button
            onClick={() => onOpen("imageViewer", { imageUrl: fileUrl })}
            className="relative mt-2 block h-48 w-48 overflow-hidden rounded-md border border-discord-active cursor-zoom-in"
          >
            <Image
              src={fileUrl!}
              alt={content}
              fill
              className="object-cover"
            />
          </button>
        )}

        {/* PDF */}
        {isPDF && (
          <div className="relative mt-2 flex items-center gap-2 rounded-md bg-discord-darker p-2">
            <FileIcon className="h-10 w-10 fill-campfire-orange/10 stroke-campfire-orange" />
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-campfire-orange hover:underline"
            >
              PDF File
            </a>
          </div>
        )}

        {/* Text content */}
        {!fileUrl && !isEditing && (
          <p
            className={cn(
              "text-sm text-discord-text",
              deleted && "italic text-discord-muted text-xs mt-1"
            )}
          >
            {content}
            {isUpdated && !deleted && (
              <span className="ml-1 text-[10px] text-discord-muted">
                (edited)
              </span>
            )}
          </p>
        )}

        {/* Edit form */}
        {!fileUrl && isEditing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEdit();
            }}
            className="mt-1 flex items-center gap-2"
          >
            <input
              disabled={isLoading}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 rounded-sm bg-discord-input px-2.5 py-1.5 text-sm text-discord-text outline-none focus:ring-1 focus:ring-campfire-orange/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsEditing(false);
              }}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="text-xs text-campfire-orange hover:underline"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-discord-muted hover:underline"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* Action buttons */}
      {!deleted && (
        <div className="absolute -top-2 right-4 hidden items-center gap-1 rounded-md border border-discord-active bg-discord-channel p-0.5 shadow-sm group-hover:flex animate-fade-in">
          {canEdit && (
            <ActionTooltip label="Edit" side="top">
              <button
                onClick={() => {
                  setEditContent(content);
                  setIsEditing(true);
                }}
                className="p-1 text-discord-muted hover:text-discord-text transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
            </ActionTooltip>
          )}
          {canDelete && (
            <ActionTooltip label="Delete" side="top">
              <button
                onClick={handleDelete}
                className="p-1 text-discord-muted hover:text-discord-red transition-colors"
              >
                <Trash className="h-4 w-4" />
              </button>
            </ActionTooltip>
          )}
        </div>
      )}
    </div>
  );
}

