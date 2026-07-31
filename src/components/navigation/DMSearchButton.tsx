"use client";

import { Search } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";

export function DMSearchButton() {
  const { onOpen } = useModal();

  return (
    <button
      onClick={() => onOpen("dmSearch")}
      className="flex w-full items-center gap-x-2 rounded-sm bg-discord-darker px-2 py-1.5 text-sm text-discord-muted transition cursor-text hover:bg-discord-dark hover:text-discord-text"
    >
      <Search className="h-4 w-4" />
      Find or start a conversation
    </button>
  );
}
