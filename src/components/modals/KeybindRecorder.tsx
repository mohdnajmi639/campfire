import { useState, useEffect } from "react";
import { Keyboard } from "lucide-react";

interface KeybindRecorderProps {
  value: string;
  onChange: (key: string) => void;
}

export function KeybindRecorder({ value, onChange }: KeybindRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(e.code);
      setIsRecording(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRecording, onChange]);

  const displayKey = (code: string) => {
    if (!code) return "Unassigned";
    return code.replace("Key", "").replace("Digit", "").replace("Left", " L").replace("Right", " R");
  };

  return (
    <button
      onClick={() => setIsRecording(!isRecording)}
      className="flex w-full items-center justify-between rounded-md bg-discord-dark px-3 py-2 text-sm text-discord-text transition-colors hover:bg-black/40 focus:outline-none focus:ring-1 focus:ring-campfire-blue"
    >
      <div className="flex items-center gap-x-2">
        <Keyboard className="h-4 w-4 text-discord-muted" />
        <span className={isRecording ? "text-campfire-blue animate-pulse" : ""}>
          {isRecording ? "Recording... (Press any key)" : displayKey(value)}
        </span>
      </div>
      {!isRecording && (
        <span className="text-xs text-discord-muted bg-black/40 px-2 py-0.5 rounded">
          Edit
        </span>
      )}
    </button>
  );
}
