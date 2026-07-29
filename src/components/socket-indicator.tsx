"use client";

import { Wifi, WifiOff } from "lucide-react";

interface SocketIndicatorProps {
  isConnected: boolean;
}

export function SocketIndicator({ isConnected }: SocketIndicatorProps) {
  if (isConnected) {
    return (
      <div className="flex items-center gap-1.5 rounded-md bg-discord-green/10 px-2 py-1">
        <Wifi className="h-3.5 w-3.5 text-discord-green" />
        <span className="text-xs font-medium text-discord-green">Live</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-md bg-discord-yellow/10 px-2 py-1">
      <WifiOff className="h-3.5 w-3.5 text-discord-yellow" />
      <span className="text-xs font-medium text-discord-yellow">Polling</span>
    </div>
  );
}
