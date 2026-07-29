"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
import { Check, Copy, RefreshCw, X } from "lucide-react";

export function InviteModal() {
  const { isOpen, type, data, onClose } = useModal();
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isModalOpen = isOpen && type === "invite";
  const inviteUrl = `${window?.location?.origin}/invite/${data.server?.inviteCode}`;

  const onCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onRegenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/servers/${data.server?._id}/invite-code`, {
        method: "PATCH",
      });
      const server = await res.json();
      data.server = { ...data.server, inviteCode: server.inviteCode };
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
          <h2 className="text-xl font-bold text-white">Invite Friends</h2>
          <button onClick={onClose} className="text-discord-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-discord-muted">
          Server invite link
        </label>

        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteUrl}
            className="flex-1 rounded-sm bg-discord-darker p-2.5 text-sm text-discord-text outline-none"
          />
          <button
            onClick={onCopy}
            disabled={isLoading}
            className="rounded-sm bg-campfire-orange p-2.5 text-white transition-colors hover:bg-campfire-ember"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <button
          onClick={onRegenerate}
          disabled={isLoading}
          className="mt-4 flex items-center gap-1 text-xs text-discord-muted hover:text-discord-text transition-colors"
        >
          Generate a new link
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}
