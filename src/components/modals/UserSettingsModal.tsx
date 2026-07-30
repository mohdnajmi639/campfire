"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
import { FileUpload } from "@/components/file-upload";
import { X, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function UserSettingsModal() {
  const { isOpen, type, data, onClose } = useModal();
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isModalOpen = isOpen && type === "userSettings";

  useEffect(() => {
    if (data.user) {
      setImageUrl(data.user.image || "");
    }
  }, [data.user, isModalOpen]);

  if (!isModalOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const onSave = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });
      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/sign-in" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="w-full max-w-md rounded-lg bg-discord-channel p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">User Settings</h2>
          <button onClick={handleClose} className="text-discord-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-discord-muted">
            Profile Picture
          </label>
          <div className="flex items-center justify-center mb-4">
            <FileUpload
              endpoint="userImage"
              value={imageUrl}
              onChange={(url) => {
                setImageUrl(url || "");
              }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-discord-dark pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-sm bg-transparent px-4 py-2 text-sm font-medium text-discord-red transition hover:bg-discord-red/10"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
          
          <div className="flex justify-end gap-x-2">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-sm px-4 py-2 text-sm font-medium text-discord-text hover:underline"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isLoading || imageUrl === (data.user?.image || "")}
              className="rounded-sm bg-campfire-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-campfire-blue/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
