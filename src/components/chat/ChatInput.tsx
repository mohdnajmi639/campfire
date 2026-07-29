"use client";

import { useState } from "react";
import { Plus, SendHorizonal, Smile } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, string>;
  name: string;
  type: "channel" | "conversation";
}

export function ChatInput({ apiUrl, query, name, type }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { onOpen } = useModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsLoading(true);

    try {
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), ...query }),
      });
      setContent("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-6 pt-1">
      <div className="relative flex items-center rounded-lg bg-discord-input">
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
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Message ${type === "conversation" ? name : "#" + name}`}
          className="flex-1 bg-transparent px-3 py-3 text-sm text-discord-text outline-none placeholder:text-discord-muted disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="mr-3 text-discord-muted transition-colors hover:text-campfire-orange disabled:opacity-30"
        >
          <SendHorizonal className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}
