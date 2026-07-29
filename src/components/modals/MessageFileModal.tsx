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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in px-4">
      <div className="w-full max-w-md rounded-lg bg-discord-chat shadow-2xl animate-scale-in overflow-hidden flex flex-col">
        <div className="p-6 pb-4 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-discord-muted hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <h2 className="text-xl font-bold text-white mb-2">Add an attachment</h2>
          <p className="text-sm text-discord-muted">
            Send a file, image, or document as a message in this channel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-6 pb-6 flex justify-center">
            <FileUpload endpoint="messageFile" value={fileUrl} onChange={(url) => setFileUrl(url || "")} />
          </div>

          <div className="bg-discord-channel px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-white hover:underline px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !fileUrl}
              className="flex items-center justify-center gap-2 rounded bg-discord-blurple px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-discord-blurple/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
