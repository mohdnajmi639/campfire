"use client";

import { useEffect, useRef, useState } from "react";

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const HEARTBEAT_INTERVAL = 10 * 1000; // 10 seconds

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [isIdle, setIsIdle] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateActivity = () => {
    lastActivityRef.current = Date.now();
    if (isIdle) {
      setIsIdle(false);
      sendHeartbeat(false);
    }
  };

  const sendHeartbeat = async (idleStatus: boolean, isOffline: boolean = false) => {
    try {
      const payload = JSON.stringify({ isIdle: idleStatus, isOffline });
      
      if (isOffline && navigator.sendBeacon) {
        // More reliable for tab close
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon("/api/presence", blob);
      } else {
        await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: isOffline,
        });
      }
    } catch (error) {
      console.error("Failed to send presence heartbeat", error);
    }
  };

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, updateActivity, { passive: true }));

    intervalRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      const currentlyIdle = timeSinceLastActivity > IDLE_TIMEOUT;
      
      if (currentlyIdle !== isIdle) {
        setIsIdle(currentlyIdle);
      }
      
      sendHeartbeat(currentlyIdle);
    }, HEARTBEAT_INTERVAL);

    const handleBeforeUnload = () => {
      sendHeartbeat(isIdle, true);
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    // Initial heartbeat
    sendHeartbeat(false);

    return () => {
      events.forEach((event) => window.removeEventListener(event, updateActivity));
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isIdle]);

  return <>{children}</>;
}
