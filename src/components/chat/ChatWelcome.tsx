"use client";

import { Hash } from "lucide-react";

interface ChatWelcomeProps {
  name: string;
  type: "channel" | "conversation";
}

export function ChatWelcome({ name, type }: ChatWelcomeProps) {
  return (
    <div className="mb-4 space-y-2 px-4">
      {type === "channel" && (
        <div className="flex h-[75px] w-[75px] items-center justify-center rounded-full bg-discord-active">
          <Hash className="h-12 w-12 text-white" />
        </div>
      )}
      <p className="text-xl font-bold md:text-3xl">
        {type === "channel" ? `Welcome to #${name}` : name}
      </p>
      <p className="text-sm text-discord-muted">
        {type === "channel"
          ? `This is the start of the #${name} channel.`
          : `This is the beginning of your direct message history with ${name}.`}
      </p>
    </div>
  );
}
