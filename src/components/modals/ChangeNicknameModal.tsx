/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
import { X } from "lucide-react";

export function ChangeNicknameModal() {
  const { isOpen, type, data, onClose } = useModal();
  const router = useRouter();
  
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isModalOpen = isOpen && type === "changeNickname";

  useEffect(() => {
    if (data.member) {
      setNickname(data.member.nickname || "");
    }
  }, [data.member, isModalOpen]);

  if (!isModalOpen) return null;

  const onSave = async () => {
    try {
      setIsLoading(true);
      await fetch(`/api/members/${data.member._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, serverId: data.server?._id }),
      });
      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="w-full max-w-md rounded-lg bg-discord-channel p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Change Server Nickname</h2>
          <button onClick={onClose} className="text-discord-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-discord-muted">
            Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            disabled={isLoading}
            placeholder={data.member?.user?.name}
            className="w-full rounded-sm bg-discord-darker p-2.5 text-sm text-discord-text outline-none focus:ring-1 focus:ring-campfire-blue disabled:opacity-50"
          />
          <p className="mt-2 text-xs text-discord-muted">
            Leave blank to reset to your global username.
          </p>
        </div>

        <div className="flex justify-end gap-x-2 border-t border-discord-dark pt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-sm px-4 py-2 text-sm font-medium text-discord-text hover:underline disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isLoading}
            className="rounded-sm bg-campfire-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-campfire-blue/80 disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
