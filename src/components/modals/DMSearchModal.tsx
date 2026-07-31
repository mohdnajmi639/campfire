"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
import { Search, Loader2, MessageSquare, User as UserIcon } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

interface UserResult {
  conversationId: string;
  user: {
    name: string;
    image?: string;
  };
}

interface MessageResult {
  _id: string;
  conversationId: string;
  content: string;
  memberId: {
    userId: {
      name: string;
      image?: string;
    };
  };
}

export function DMSearchModal() {
  const { isOpen, type, onClose } = useModal();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [messages, setMessages] = useState<MessageResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isModalOpen = isOpen && type === "dmSearch";

  useEffect(() => {
    if (!isModalOpen) {
      setQuery("");
      setUsers([]);
      setMessages([]);
      return;
    }
  }, [isModalOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setUsers([]);
        setMessages([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search/dms?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const onClick = (conversationId: string) => {
    onClose();
    router.push(`/me/${conversationId}`);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-2xl rounded-lg bg-discord-channel shadow-2xl animate-scale-in flex flex-col overflow-hidden max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-discord-dark">
          <Search className="h-5 w-5 text-discord-muted mr-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a user or a message..."
            className="flex-1 bg-transparent text-lg text-discord-text placeholder-discord-muted outline-none"
            autoFocus
          />
          {isLoading && <Loader2 className="h-5 w-5 text-discord-muted animate-spin ml-3" />}
        </div>

        <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
          {!query && (
            <div className="py-12 text-center text-sm text-discord-muted">
              Start typing to search your conversations...
            </div>
          )}

          {query && !isLoading && users.length === 0 && messages.length === 0 && (
            <div className="py-12 text-center text-sm text-discord-muted">
              No results found for "{query}".
            </div>
          )}

          {users.length > 0 && (
            <div className="mb-4">
              <div className="px-2 py-1 text-xs font-semibold uppercase text-discord-muted">Users</div>
              {users.map((result) => (
                <button
                  key={`user-${result.conversationId}`}
                  onClick={() => onClick(result.conversationId)}
                  className="w-full flex items-center gap-x-3 px-2 py-2 rounded-md hover:bg-discord-hover transition-colors text-left"
                >
                  <UserAvatar src={result.user.image} name={result.user.name} className="h-8 w-8" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-discord-text truncate">{result.user.name}</p>
                  </div>
                  <UserIcon className="h-4 w-4 text-discord-muted" />
                </button>
              ))}
            </div>
          )}

          {messages.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-semibold uppercase text-discord-muted">Messages</div>
              {messages.map((msg) => (
                <button
                  key={`msg-${msg._id}`}
                  onClick={() => onClick(msg.conversationId)}
                  className="w-full flex items-start gap-x-3 px-2 py-2 rounded-md hover:bg-discord-hover transition-colors text-left"
                >
                  <UserAvatar src={msg.memberId?.userId?.image} name={msg.memberId?.userId?.name} className="h-8 w-8 mt-0.5" />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-x-2">
                      <p className="text-sm font-semibold text-discord-text truncate">{msg.memberId?.userId?.name}</p>
                    </div>
                    <p className="text-sm text-discord-muted line-clamp-2 break-words">{msg.content}</p>
                  </div>
                  <MessageSquare className="h-4 w-4 text-discord-muted mt-1" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
