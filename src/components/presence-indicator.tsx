import { cn } from "@/lib/utils";

interface PresenceIndicatorProps {
  status?: "online" | "idle" | "dnd" | "invisible" | "offline";
  className?: string;
}

export function PresenceIndicator({ status = "offline", className }: PresenceIndicatorProps) {
  if (status === "offline" || status === "invisible") {
    return (
      <div
        className={cn(
          "absolute bottom-0 right-0 h-[14px] w-[14px] rounded-full border-[2.5px] border-[#232428] bg-gray-500",
          className
        )}
      />
    );
  }

  if (status === "dnd") {
    return (
      <div
        className={cn(
          "absolute bottom-0 right-0 flex h-[14px] w-[14px] items-center justify-center rounded-full border-[2.5px] border-[#232428] bg-[#F23F42]",
          className
        )}
      >
        <div className="h-[2px] w-[6px] rounded-sm bg-[#232428]" />
      </div>
    );
  }

  if (status === "idle") {
    return (
      <div
        className={cn(
          "absolute bottom-0 right-0 flex h-[14px] w-[14px] items-center justify-center rounded-full border-[2.5px] border-[#232428] bg-[#F0B132]",
          className
        )}
      >
        <div className="absolute top-[-1px] left-[-1px] h-[8px] w-[8px] rounded-full bg-[#232428]" />
      </div>
    );
  }

  // online
  return (
    <div
      className={cn(
        "absolute bottom-0 right-0 h-[14px] w-[14px] rounded-full border-[2.5px] border-[#232428] bg-[#23A559]",
        className
      )}
    />
  );
}
