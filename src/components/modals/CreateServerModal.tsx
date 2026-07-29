"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
import { FileUpload } from "@/components/file-upload";
import { Loader2, X } from "lucide-react";

export function CreateServerModal() {
  const { isOpen, type, onClose } = useModal();
  const router = useRouter();
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isModalOpen = isOpen && type === "createServer";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, imageUrl }),
      });
      const server = await res.json();
      onClose();
      setName("");
      setImageUrl("");
      router.push(`/servers/${server._id}`);
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
          <h2 className="text-xl font-bold text-white">Create Your Server</h2>
          <button onClick={onClose} className="text-discord-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-5 text-sm text-discord-muted">
          Give your new server a personality with a name and an icon. You can always change it later.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <FileUpload endpoint="serverImage" value={imageUrl} onChange={(url) => setImageUrl(url || "")} />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-discord-muted">
              Server Name
            </label>
            <input
              disabled={isLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter server name"
              className="w-full rounded-sm bg-discord-darker p-2.5 text-sm text-discord-text outline-none focus:ring-2 focus:ring-campfire-orange/50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-campfire-orange py-2.5 text-sm font-medium text-white transition-colors hover:bg-campfire-ember disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </button>
        </form>
      </div>
    </div>
  );
}
