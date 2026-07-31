"use client";

import { useState } from "react";
import { Plus, SendHorizonal, X } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";
import { useReplyStore } from "@/hooks/use-reply-store";
import { useMemberStore } from "@/hooks/use-member-store";

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, string>;
  name: string;
  type: "channel" | "conversation";
}

export function ChatInput({ apiUrl, query, name, type }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Autocomplete state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);

  const { onOpen } = useModal();
  const { reply, clearReply } = useReplyStore();
  const { members } = useMemberStore();

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setContent(val);

    const lastAtPos = val.lastIndexOf("@");
    if (lastAtPos !== -1) {
      // Check if there is space after @, or if it's start of string or after a space
      const isStartOrSpace = lastAtPos === 0 || val[lastAtPos - 1] === " ";
      if (isStartOrSpace) {
        const query = val.slice(lastAtPos + 1);
        setMentionQuery(query);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  };

  const filteredMembers = Object.values(members).filter((m) =>
    m.name.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5); // Limit to top 5

  const insertMention = (memberName: string) => {
    const lastAtPos = content.lastIndexOf("@");
    if (lastAtPos !== -1) {
      const newContent = content.slice(0, lastAtPos) + `@${memberName} `;
      setContent(newContent);
      setShowMentions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredMembers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMembers[mentionIndex].name);
        return;
      }
      if (e.key === "Escape") {
        setShowMentions(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsLoading(true);

    try {
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: content.trim(), 
          replyToId: reply?.messageId,
          ...query 
        }),
      });
      setContent("");
      clearReply();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 pb-6 pt-1">
      {reply && (
        <div className="flex items-center justify-between bg-discord-darker text-discord-muted px-4 py-2 text-sm rounded-t-lg border-b border-discord-dark">
          <div className="flex items-center gap-x-2">
            <span>Replying to <span className="font-semibold text-discord-text">@{reply.name}</span></span>
          </div>
          <button 
            onClick={clearReply}
            className="hover:text-discord-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="relative">
        <div className={`relative flex items-center bg-discord-input ${reply ? 'rounded-b-lg' : 'rounded-lg'}`}>
          <button
            type="button"
            onClick={() =>
              onOpen("messageFile", { apiUrl, query })
            }
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-discord-muted/30 ml-3 transition-colors hover:bg-discord-muted/50"
          >
            <Plus className="h-4 w-4 text-discord-text" />
          </button>
          <input
            disabled={isLoading}
            value={content}
            onChange={handleContentChange}
            placeholder={`Message ${type === "conversation" ? name : "#" + name}`}
            className="flex-1 bg-transparent px-3 py-3 text-sm text-discord-text outline-none placeholder:text-discord-muted disabled:opacity-50"
            onKeyDown={handleKeyDown}
          />
          {showMentions && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-64 rounded-md bg-discord-channel border border-discord-dark shadow-lg overflow-hidden z-50">
              <div className="px-3 py-2 text-xs font-semibold text-discord-muted uppercase bg-discord-darker border-b border-discord-dark">
                Members
              </div>
              <ul className="py-1">
                {filteredMembers.map((member, index) => (
                  <li
                    key={index}
                    onClick={() => insertMention(member.name)}
                    onMouseEnter={() => setMentionIndex(index)}
                    className={`px-3 py-2 cursor-pointer flex items-center gap-x-2 text-sm transition-colors ${
                      index === mentionIndex
                        ? "bg-campfire-blue text-white"
                        : "text-discord-text hover:bg-discord-dark"
                    }`}
                  >
                    <span>@{member.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="mr-3 text-discord-muted transition-colors hover:text-campfire-orange disabled:opacity-30"
          >
            <SendHorizonal className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
