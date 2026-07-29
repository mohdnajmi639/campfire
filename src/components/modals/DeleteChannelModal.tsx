"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
import { Loader2, X } from "lucide-react";

export function DeleteChannelModal() {
  const { isOpen, type, data, onClose } = useModal();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isModalOpen = isOpen && type === "deleteChannel";

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await fetch(
        `/api/channels/${data.channel?._id}?serverId=${data.server?._id}`,
        { method: "DELETE" }
      );
      onClose();
      router.push(`/servers/${data.server?._id}`);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="w-full max-w-md rounded-lg bg-discord-channel p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Delete Channel</h2>
          <button onClick={onClose} className="text-discord-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-6 text-sm text-discord-muted">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-campfire-orange">#{data.channel?.name}</span>?
          This will permanently delete all messages in this channel.
        </p>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} disabled={isLoading} className="rounded-sm px-4 py-2 text-sm text-discord-muted hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-sm bg-discord-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-discord-red/80 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete Channel
          </button>
        </div>
      </div>
    </div>
  );
}
