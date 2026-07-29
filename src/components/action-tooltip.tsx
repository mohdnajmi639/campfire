"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface ActionTooltipProps {
  label: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function ActionTooltip({
  label,
  children,
  side = "right",
  align = "center",
}: ActionTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
  };

  const alignClasses = {
    start: side === "top" || side === "bottom" ? "!left-0 !translate-x-0" : "!top-0 !translate-y-0",
    center: "",
    end: side === "top" || side === "bottom" ? "!left-auto !right-0 !translate-x-0" : "!top-auto !bottom-0 !translate-y-0",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 whitespace-nowrap rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white shadow-lg animate-scale-in pointer-events-none",
            positionClasses[side],
            alignClasses[align]
          )}
        >
          {label}
        </div>
      )}
    </div>
  );
}
