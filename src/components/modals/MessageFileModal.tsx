"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
import { FileUpload } from "@/components/file-upload";
import { Loader2, X } from "lucide-react";

export function MessageFileModal() {
  const { isOpen, type, data, onClose } = useModal();
  const router = useRouter();
  const [fileUrl, setFileUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isModalOpen = isOpen && type === "messageFile";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl) return;

    setIsLoading(true);
    try {
      await fetch(data.apiUrl as string, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "📎 File attachment",
          fileUrl,
          ...data.query,
        }),
      });
      setFileUrl("");
      onClose();
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
          <h2 className="text-xl font-bold text-white">Add an attachment</h2>
          <button onClick={onClose} className="text-discord-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-discord-muted">Send a file as a message</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <FileUpload endpoint="messageFile" value={fileUrl} onChange={(url) => setFileUrl(url || "")} />
          </div>

          <button
            type="submit"
            disabled={isLoading || !fileUrl}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-campfire-orange py-2.5 text-sm font-medium text-white transition-colors hover:bg-campfire-ember disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
