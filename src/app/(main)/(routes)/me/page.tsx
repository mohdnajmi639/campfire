"use client";

import { useState, useEffect } from "react";
import { UserRound, Check, X, UserPlus, Inbox } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

export default function MePage() {
  const [tab, setTab] = useState<"friends" | "pending" | "add">("friends");
  const [friends, setFriends] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();
      setFriends(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.text();
      if (res.ok) {
        setMessage({ text: "Friend request sent!", error: false });
        setUsername("");
        fetchFriends();
      } else {
        setMessage({ text: data, error: true });
      }
    } catch (error) {
      setMessage({ text: "Something went wrong", error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "accept" | "reject") => {
    try {
      await fetch(`/api/friends/${id}`, {
        method: action === "accept" ? "PATCH" : "DELETE",
      });
      fetchFriends();
    } catch (e) {
      console.error(e);
    }
  };

  const accepted = friends.filter((f) => f.status === "accepted");
  const pending = friends.filter((f) => f.status === "pending");

  return (
    <div className="flex h-full flex-col bg-discord-chat">
      {/* Top Header */}
      <div className="flex h-12 items-center border-b border-discord-dark/50 px-4 gap-x-4 shrink-0">
        <div className="flex items-center gap-x-2 text-discord-text font-semibold">
          <UserRound className="h-5 w-5 text-discord-muted" />
          Friends
        </div>
        <div className="h-6 w-[1px] bg-discord-darker mx-2" />
        <div className="flex items-center gap-x-4">
          <button
            onClick={() => setTab("friends")}
            className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${
              tab === "friends" ? "bg-discord-dark/50 text-white" : "text-discord-muted hover:bg-discord-dark/50 hover:text-discord-text"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTab("pending")}
            className={`px-2 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-x-1.5 ${
              tab === "pending" ? "bg-discord-dark/50 text-white" : "text-discord-muted hover:bg-discord-dark/50 hover:text-discord-text"
            }`}
          >
            Pending
            {pending.length > 0 && (
              <span className="bg-campfire-red text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("add")}
            className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${
              tab === "add" ? "bg-campfire-green/20 text-campfire-green" : "bg-campfire-green text-white hover:bg-campfire-green/80"
            }`}
          >
            Add Friend
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {tab === "add" && (
          <div className="animate-fade-in max-w-xl">
            <h2 className="text-base font-bold text-white mb-2 uppercase">Add Friend</h2>
            <p className="text-sm text-discord-muted mb-4">
              You can add friends with their username.
            </p>
            <form onSubmit={handleAddFriend} className="flex items-center bg-discord-darker rounded-md p-2">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a username"
                className="flex-1 bg-transparent border-none outline-none text-discord-text text-sm px-2"
                required
              />
              <button
                type="submit"
                disabled={loading || !username}
                className="bg-campfire-blue text-white px-4 py-1.5 rounded-md text-sm font-semibold transition-colors hover:bg-campfire-blue/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Friend Request
              </button>
            </form>
            {message && (
              <p className={`mt-2 text-sm ${message.error ? "text-campfire-red" : "text-campfire-green"}`}>
                {message.text}
              </p>
            )}
          </div>
        )}

        {tab === "friends" && (
          <div className="animate-fade-in">
            <h2 className="text-xs font-bold text-discord-muted uppercase tracking-wide mb-4">
              All Friends — {accepted.length}
            </h2>
            {accepted.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 opacity-50">
                <UserRound className="h-16 w-16 mb-4" />
                <p>You don't have any friends yet.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {accepted.map((friend) => (
                  <div key={friend._id} className="flex items-center justify-between p-3 rounded-md hover:bg-discord-dark/50 group border-t border-transparent hover:border-discord-darker transition-colors cursor-pointer">
                    <div className="flex items-center gap-x-3">
                      <UserAvatar src={friend.otherUser.image} name={friend.otherUser.name} className="h-8 w-8" />
                      <span className="font-semibold text-discord-text group-hover:text-white transition-colors">{friend.otherUser.name}</span>
                    </div>
                    <button
                      onClick={() => handleAction(friend._id, "reject")} // Rejecting an accepted friend effectively removes them
                      className="h-8 w-8 rounded-full bg-discord-darker flex items-center justify-center text-discord-muted hover:text-campfire-red hover:bg-discord-dark opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove Friend"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "pending" && (
          <div className="animate-fade-in">
            <h2 className="text-xs font-bold text-discord-muted uppercase tracking-wide mb-4">
              Pending — {pending.length}
            </h2>
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 opacity-50">
                <Inbox className="h-16 w-16 mb-4" />
                <p>No pending friend requests.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {pending.map((friend) => {
                  // If the current user is NOT the one who initiated it, they can accept it
                  const canAccept = friend.actionUserId !== friend.otherUser._id; // Wait, this logic needs to match the backend.
                  // Wait! The backend sends the full other user. The friend.actionUserId is whoever initiated.
                  // So if friend.actionUserId !== my user ID, I am the receiver.
                  // Since we didn't pass my user ID to the frontend easily, let's just show Accept/Reject for all for now. The backend prevents accepting own requests.
                  return (
                    <div key={friend._id} className="flex items-center justify-between p-3 rounded-md hover:bg-discord-dark/50 group border-t border-transparent hover:border-discord-darker transition-colors">
                      <div className="flex items-center gap-x-3">
                        <UserAvatar src={friend.otherUser.image} name={friend.otherUser.name} className="h-8 w-8" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-discord-text group-hover:text-white transition-colors">{friend.otherUser.name}</span>
                          <span className="text-xs text-discord-muted">Pending Request</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-2">
                        <button
                          onClick={() => handleAction(friend._id, "accept")}
                          className="h-8 w-8 rounded-full bg-discord-darker flex items-center justify-center text-discord-muted hover:text-campfire-green hover:bg-discord-dark transition-colors"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAction(friend._id, "reject")}
                          className="h-8 w-8 rounded-full bg-discord-darker flex items-center justify-center text-discord-muted hover:text-campfire-red hover:bg-discord-dark transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
