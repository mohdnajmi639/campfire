"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Edit, FileIcon, Trash, ShieldAlert, ShieldCheck, Reply, CornerUpLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { ActionTooltip } from "@/components/action-tooltip";
import { MemberRole } from "@/types";
import { useModal } from "@/hooks/use-modal-store";
import { useReplyStore } from "@/hooks/use-reply-store";

interface ChatItemProps {
  id: string;
  content: string;
  member: {
    _id: string;
    role: string;
    nickname?: string;
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
  type: "channel" | "conversation";
  replyTo?: any;
  mentions?: any[];
  currentUserId?: string;
  actionTooltipSide?: "top" | "right" | "bottom" | "left";
}

const roleIconMap: Record<string, React.ReactNode> = {
  [MemberRole.ADMIN]: <ShieldAlert className="h-4 w-4 text-discord-red" />,
  [MemberRole.MODERATOR]: <ShieldCheck className="h-4 w-4 text-campfire-orange" />,
  [MemberRole.GUEST]: null,
};

const DATE_FORMAT = "d MMM yyyy, h:mm a";

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
  type,
  replyTo,
  mentions = [],
  currentUserId,
  actionTooltipSide = "top",
}: ChatItemProps) {
  const { onOpen } = useModal();
  const { setReply } = useReplyStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isLoading, setIsLoading] = useState(false);

  const fileType = fileUrl?.split(".").pop();
  const isImage = fileUrl && fileType !== "pdf";
  const isPDF = fileUrl && fileType === "pdf";

  // Fallback if member or member.userId is missing (e.g. deleted user)
  if (!member || !member.userId) {
    return null;
  }

  const isOwner = member._id === currentMemberId;
  const isAdmin = currentMemberRole === MemberRole.ADMIN;
  const isModerator = currentMemberRole === MemberRole.MODERATOR;
  
  // Only owners can delete in DMs. In channels, admins and mods can delete.
  const canDelete = isOwner || (type === "channel" && (isAdmin || isModerator));
  const canEdit = !deleted && isOwner && !fileUrl;


  const handleEdit = async () => {
    if (!editContent.trim() || editContent === content) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = type === "channel" ? `/api/messages/${id}` : `/api/direct-messages/${id}`;
      await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: editContent, 
          serverId: type === "channel" ? serverId : undefined, 
          channelId: type === "channel" ? channelId : undefined,
          conversationId: type === "conversation" ? channelId : undefined
        }),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit message:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const openDeleteModal = () => {
    const apiUrl = type === "channel" ? `/api/messages/${id}` : `/api/direct-messages/${id}`;
    const query = type === "channel" 
      ? { serverId, channelId } 
      : { conversationId: channelId };
      
    onOpen("deleteMessage", { apiUrl, query: query as any as Record<string, string>, isDeleted: deleted });
  };

  const scrollToReply = () => {
    if (!replyTo?._id) return;
    const element = document.getElementById(`message-${replyTo._id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("bg-discord-active/50", "transition-colors", "duration-500");
      setTimeout(() => {
        element.classList.remove("bg-discord-active/50");
      }, 2000);
    }
  };

  const isMentioned = currentUserId && mentions.some((m) => (m._id || m).toString() === currentUserId.toString());

  const renderContent = () => {
    if (!content) return null;
    // Split by @username based on mentions array
    let highlightedContent: React.ReactNode[] = [content];
    
    mentions.forEach((mention) => {
      const name = mention.name;
      if (!name) return;
      const mentionStr = `@${name}`;
      
      const newContent: React.ReactNode[] = [];
      highlightedContent.forEach((part) => {
        if (typeof part === "string") {
          const split = part.split(mentionStr);
          split.forEach((s, i) => {
            newContent.push(s);
            if (i < split.length - 1) {
              newContent.push(
                <span key={`${name}-${i}`} className="bg-campfire-blue/20 text-campfire-blue font-semibold px-1 rounded-sm">
                  {mentionStr}
                </span>
              );
            }
          });
        } else {
          newContent.push(part);
        }
      });
      highlightedContent = newContent;
    });

    return <>{highlightedContent}</>;
  };

  return (
    <div id={`message-${id}`} className={cn(
      "group relative flex flex-col px-4 py-2.5 chat-item-hover transition-colors duration-500",
      isMentioned && "bg-[#F0B132]/5 border-l-[3px] border-[#F0B132]/70 hover:bg-[#F0B132]/10"
    )}>
      {replyTo && (
        <div 
          onClick={scrollToReply}
          className="flex items-center gap-x-2 pl-[42px] mb-1 text-sm text-discord-muted relative group/reply cursor-pointer hover:text-discord-text transition-colors"
        >
          {/* The curved reply line */}
          <div className="absolute left-[21px] top-1/2 -mt-[1px] w-[20px] h-[14px] border-l-2 border-t-2 border-discord-muted/50 rounded-tl-md group-hover/reply:border-discord-text/50 transition-colors" />
          
          <UserAvatar 
            src={replyTo.memberId?.userId?.image} 
            name={replyTo.memberId?.nickname || replyTo.memberId?.userId?.name || "Unknown"}
            className="h-4 w-4 relative z-10"
          />
          <span className="font-semibold text-discord-text text-xs hover:underline">
            {replyTo.memberId?.nickname || replyTo.memberId?.userId?.name || "Unknown User"}
          </span>
          <span className="text-xs truncate max-w-[400px]">
            {replyTo.content || "Attachment"}
          </span>
        </div>
      )}

      <div className="flex items-start gap-x-3">
        {/* Avatar */}
        <UserAvatar
          src={member.userId?.image}
          name={member.userId?.name}
          className="mt-0.5 h-9 w-9 cursor-pointer z-10 bg-discord-channel"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-x-2">
            <span className="text-sm font-semibold text-discord-text hover:underline cursor-pointer">
              {member.nickname || member.userId?.name}
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
              {renderContent()}
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
        <div className="absolute -top-2 right-4 hidden items-center gap-1 rounded-md border border-discord-active bg-discord-channel p-0.5 shadow-sm group-hover:flex animate-fade-in z-20">
          {!deleted && (
            <ActionTooltip label="Reply" side={actionTooltipSide}>
              <button
                onClick={() => setReply({ messageId: id, memberId: member._id, name: member.nickname || member.userId?.name || "Unknown" })}
                className="p-1 text-discord-muted hover:text-discord-text transition-colors"
              >
                <CornerUpLeft className="h-4 w-4" />
              </button>
            </ActionTooltip>
          )}



          {canEdit && (
            <ActionTooltip label="Edit" side={actionTooltipSide}>
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
            <ActionTooltip label="Delete" side={actionTooltipSide}>
              <button
                onClick={openDeleteModal}
                className="p-1 text-discord-muted hover:text-discord-red transition-colors"
              >
                <Trash className="h-4 w-4" />
              </button>
            </ActionTooltip>
          )}
        </div>
      </div>
    </div>
  );
}

