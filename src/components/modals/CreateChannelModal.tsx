"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
import { ChannelType } from "@/types";
import { Hash, Loader2, Mic, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreateChannelModal() {
  const { isOpen, type, data, onClose } = useModal();
  const router = useRouter();
  const [name, setName] = useState("");
  const [channelType, setChannelType] = useState<ChannelType>(
    data.channelType || ChannelType.TEXT
  );
  const [isLoading, setIsLoading] = useState(false);

  const isModalOpen = isOpen && type === "createChannel";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.toLowerCase().replace(/\s+/g, "-"),
          type: channelType,
          serverId: data.server?._id,
        }),
      });
      onClose();
      setName("");
      setChannelType(ChannelType.TEXT);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isModalOpen) return null;

  const types = [
    { value: ChannelType.TEXT, label: "Text", Icon: Hash, desc: "Send messages, images, GIFs, and more" },
    { value: ChannelType.AUDIO, label: "Voice", Icon: Mic, desc: "Hang out together with voice" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="w-full max-w-md rounded-lg bg-discord-channel p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Create Channel</h2>
          <button onClick={onClose} className="text-discord-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-discord-muted">
              Channel Type
            </label>
            <div className="space-y-2">
              {types.map(({ value, label, Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setChannelType(value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-sm p-3 transition-colors",
                    channelType === value
                      ? "bg-discord-active"
                      : "bg-discord-darker hover:bg-discord-hover"
                  )}
                >
                  <Icon className="h-5 w-5 text-discord-muted" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-discord-text">{label}</p>
                    <p className="text-xs text-discord-muted">{desc}</p>
                  </div>
                  <div
                    className={cn(
                      "ml-auto h-5 w-5 rounded-full border-2",
                      channelType === value
                        ? "border-campfire-orange bg-campfire-orange"
                        : "border-discord-muted"
                    )}
                  >
                    {channelType === value && (
                      <div className="flex h-full items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-discord-muted">
              Channel Name
            </label>
            <div className="flex items-center rounded-sm bg-discord-darker">
              <Hash className="ml-2 h-4 w-4 text-discord-muted" />
              <input
                disabled={isLoading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="new-channel"
                className="flex-1 bg-transparent p-2.5 text-sm text-discord-text outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-campfire-orange py-2.5 text-sm font-medium text-white transition-colors hover:bg-campfire-ember disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Channel
          </button>
        </form>
      </div>
    </div>
  );
}

