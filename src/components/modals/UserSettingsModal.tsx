/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
import { useSettingsStore } from "@/hooks/use-settings-store";
import { FileUpload } from "@/components/file-upload";
import { MicTester } from "./MicTester";
import { X, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function UserSettingsModal() {
  const { isOpen, type, data, onClose } = useModal();
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const micThreshold = useSettingsStore((s) => s.micThreshold);
  const setMicThreshold = useSettingsStore((s) => s.setMicThreshold);

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

        <div className="mb-6">
          <label className="mb-4 block text-xs font-bold uppercase tracking-wide text-discord-muted">
            Voice Settings
          </label>
          <div className="space-y-4 bg-black/20 p-4 rounded-md">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-discord-text">Input Sensitivity</span>
                <span className="text-xs text-discord-muted font-mono">{Math.round(micThreshold * 100)}%</span>
              </div>
              <p className="text-xs text-discord-muted mb-3 leading-relaxed">
                Automatically determines when your voice is transmitted. If your green ring is constantly lit up by background noise, slide this slightly to the right.
              </p>
              <div className="flex items-center gap-x-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={micThreshold}
                  onChange={(e) => setMicThreshold(parseFloat(e.target.value))}
                  className="w-full h-2 bg-discord-dark rounded-lg appearance-none cursor-pointer accent-campfire-blue"
                />
              </div>
            </div>
            
            <MicTester />
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
