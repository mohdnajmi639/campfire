"use client";

import { Smile } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useState, useRef, useEffect } from "react";

interface EmojiPickerProps {
  onChange: (value: string) => void;
}

export const EmojiPicker = ({ onChange }: EmojiPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center text-discord-muted hover:text-campfire-orange transition-colors"
      >
        <Smile className="h-5 w-5" />
      </button>
      {isOpen && (
        <div className="absolute bottom-10 right-0 z-50 mb-2 shadow-2xl drop-shadow-sm">
          <Picker
            data={data}
            onEmojiSelect={(emoji: any) => {
              onChange(emoji.native);
              setIsOpen(false);
            }}
            theme="dark"
          />
        </div>
      )}
    </div>
  );
};
