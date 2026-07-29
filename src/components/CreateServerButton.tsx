"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Flame, Plus } from "lucide-react";

export function CreateServerButton() {
  const { onOpen } = useModal();

  return (
    <button
      onClick={() => onOpen("createServer")}
      className="inline-flex items-center gap-2 rounded-lg bg-campfire-orange px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-campfire-ember hover:shadow-lg hover:shadow-campfire-orange/20"
    >
      <Plus className="h-5 w-5" />
      Create My First Server
    </button>
  );
}
