"use client";

import { useState } from "react";
import { MemberRole } from "@/models/Member";
import { useModal } from "@/hooks/use-modal-store";
import {
  ChevronDown,
  LogOut,
  PlusCircle,
  Settings,
  Trash,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServerHeaderProps {
  server: {
    _id: string;
    name: string;
    imageUrl: string;
    inviteCode: string;
    userId: string;
  };
  role?: string;
}

export function ServerHeader({ server, role }: ServerHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { onOpen } = useModal();

  const isAdmin = role === MemberRole.ADMIN;
  const isModerator = isAdmin || role === MemberRole.MODERATOR;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-full items-center justify-between border-b-2 border-discord-darker/50 px-3 text-sm font-semibold text-discord-text transition-colors hover:bg-discord-hover"
      >
        <span className="truncate">{server.name}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-2 right-2 top-14 z-50 rounded-md bg-discord-darker p-1.5 shadow-xl animate-scale-in">
            {isModerator && (
              <button
                onClick={() => {
                  onOpen("invite", { server });
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-campfire-orange hover:bg-campfire-orange hover:text-white transition-colors"
              >
                Invite People
                <UserPlus className="ml-auto h-4 w-4" />
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  onOpen("editServer", { server });
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-discord-muted hover:bg-campfire-orange hover:text-white transition-colors"
              >
                Server Settings
                <Settings className="ml-auto h-4 w-4" />
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  onOpen("members", { server });
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-discord-muted hover:bg-campfire-orange hover:text-white transition-colors"
              >
                Manage Members
                <Users className="ml-auto h-4 w-4" />
              </button>
            )}
            {isModerator && (
              <button
                onClick={() => {
                  onOpen("createChannel", { server });
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-discord-muted hover:bg-campfire-orange hover:text-white transition-colors"
              >
                Create Channel
                <PlusCircle className="ml-auto h-4 w-4" />
              </button>
            )}
            {isModerator && (
              <div className="my-1 h-px bg-discord-active" />
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  onOpen("deleteServer", { server });
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-discord-red hover:bg-discord-red hover:text-white transition-colors"
              >
                Delete Server
                <Trash className="ml-auto h-4 w-4" />
              </button>
            )}
            {!isAdmin && (
              <button
                onClick={() => {
                  onOpen("leaveServer", { server });
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-discord-red hover:bg-discord-red hover:text-white transition-colors"
              >
                Leave Server
                <LogOut className="ml-auto h-4 w-4" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
