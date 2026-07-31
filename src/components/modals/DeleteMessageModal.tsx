"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";

export function DeleteMessageModal() {
  const { isOpen, onClose, type, data } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  
  // If the message is already deleted, it MUST be a hard delete. Otherwise, let user choose.
  const [hardDelete, setHardDelete] = useState(false);

  const isModalOpen = isOpen && type === "deleteMessage";
  const { apiUrl, query, isDeleted } = data;

  const onClick = async () => {
    try {
      setIsLoading(true);
      const url = new URL(apiUrl!, window.location.origin);
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }
      
      const isHardDelete = isDeleted || hardDelete;
      if (isHardDelete) {
        url.searchParams.append("hardDelete", "true");
      }

      await fetch(url.toString(), {
        method: "DELETE",
      });

      onClose();
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
          <h2 className="text-xl font-bold text-white">Delete Message</h2>
          <button onClick={onClose} className="text-discord-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-6 text-sm text-discord-muted">
          Are you sure you want to do this? <br />
          The message will be deleted.
        </p>

        <div className="mb-6 flex items-center gap-x-2">
          <input
            type="checkbox"
            id="hardDelete"
            checked={isDeleted || hardDelete}
            disabled={isDeleted}
            onChange={(e) => setHardDelete(e.target.checked)}
            className="w-4 h-4 rounded border-discord-muted text-campfire-orange focus:ring-campfire-orange/50 bg-discord-input"
          />
          <label htmlFor="hardDelete" className="text-sm text-discord-text select-none cursor-pointer">
            Delete completely (removes it entirely from chat)
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} disabled={isLoading} className="rounded-sm px-4 py-2 text-sm text-discord-muted hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={onClick}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-sm bg-discord-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-discord-red/80 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
