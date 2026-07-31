export function getPresenceStatus(
  user: {
    manualPresence?: "online" | "idle" | "dnd" | "invisible";
    isClientIdle?: boolean;
    lastSeen?: Date | string;
  },
  isViewerSuperAdmin: boolean = false
): "online" | "idle" | "dnd" | "invisible" | "offline" {
  if (!isViewerSuperAdmin && user.manualPresence === "invisible") {
    return "invisible";
  }
  
  if (user.lastSeen) {
    const timeSinceLastSeen = Date.now() - new Date(user.lastSeen).getTime();
    if (timeSinceLastSeen > 20 * 1000) {
      return "offline";
    }
  } else {
    // No lastSeen ever recorded => offline
    return "offline";
  }

  if (user.manualPresence === "dnd") return "dnd";
  if (user.manualPresence === "idle" || user.isClientIdle) return "idle";
  
  return "online";
}
