"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/hooks/use-modal-store";
import { Check, Copy, RefreshCw, X } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

export function InviteModal() {
  const { isOpen, type, data, onClose, onOpen } = useModal();
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [friends, setFriends] = useState<any[]>([]);
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});

  const isModalOpen = isOpen && type === "invite";
  const inviteUrl = `${window?.location?.origin}/invite/${data.server?.inviteCode}`;

  useEffect(() => {
    if (isModalOpen) {
      // Fetch friends when modal opens
      fetch("/api/friends")
        .then((res) => res.json())
        .then((data) => {
          // Only show accepted friends
          setFriends(data.filter((f: any) => f.status === "accepted"));
        })
        .catch(console.error);
    }
  }, [isModalOpen]);

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
      onOpen("invite", { server: { ...data.server, inviteCode: server.inviteCode } });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onInviteFriend = async (friendId: string) => {
    try {
      setInvitedMap((prev) => ({ ...prev, [friendId]: true }));
      await fetch(`/api/servers/${data.server?._id}/invite-friend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });
    } catch (error) {
      console.error(error);
      setInvitedMap((prev) => ({ ...prev, [friendId]: false }));
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="w-full max-w-md rounded-lg bg-discord-channel p-6 shadow-2xl animate-scale-in flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Invite friends to {data.server?.name}</h2>
          <button onClick={onClose} className="text-discord-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 mb-4">
          {friends.length === 0 ? (
            <div className="text-center text-sm text-discord-muted py-4">
              You don't have any friends to invite yet!
            </div>
          ) : (
            friends.map((friend) => (
              <div key={friend._id} className="flex items-center justify-between p-2 rounded-md hover:bg-discord-dark/50 transition-colors">
                <div className="flex items-center gap-x-3">
                  <UserAvatar src={friend.otherUser.image} name={friend.otherUser.name} className="h-8 w-8" />
                  <span className="text-sm font-semibold text-discord-text">{friend.otherUser.name}</span>
                </div>
                <button
                  onClick={() => onInviteFriend(friend.otherUser._id)}
                  disabled={invitedMap[friend.otherUser._id]}
                  className={`px-4 py-1.5 rounded-sm text-sm font-medium transition-colors ${
                    invitedMap[friend.otherUser._id] 
                      ? "bg-discord-darker text-discord-muted cursor-not-allowed" 
                      : "bg-campfire-blue text-white hover:bg-campfire-blue/80"
                  }`}
                >
                  {invitedMap[friend.otherUser._id] ? "Sent" : "Invite"}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-discord-dark pt-4">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-discord-muted">
            Or send a server invite link
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
              className="rounded-sm bg-campfire-blue p-2.5 text-white transition-colors hover:bg-campfire-blue/80"
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
    </div>
  );
}
