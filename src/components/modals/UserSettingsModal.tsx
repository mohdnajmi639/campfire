import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
import { useSettingsStore } from "@/hooks/use-settings-store";
import { FileUpload } from "@/components/file-upload";
import { MicTester } from "./MicTester";
import { KeybindRecorder } from "./KeybindRecorder";
import { X, LogOut, Activity, Mic, Keyboard } from "lucide-react";
import { signOut } from "next-auth/react";

export function UserSettingsModal() {
  const { isOpen, type, data, onClose } = useModal();
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState("");
  const [statusText, setStatusText] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const micThreshold = useSettingsStore((s) => s.micThreshold);
  const setMicThreshold = useSettingsStore((s) => s.setMicThreshold);
  const echoCancellation = useSettingsStore((s) => s.echoCancellation);
  const setEchoCancellation = useSettingsStore((s) => s.setEchoCancellation);
  const voiceMode = useSettingsStore((s) => s.voiceMode);
  const setVoiceModeStore = useSettingsStore((s) => s.setVoiceMode);
  const pttKeybind = useSettingsStore((s) => s.pttKeybind);
  const setPttKeybindStore = useSettingsStore((s) => s.setPttKeybind);

  const [localMicThreshold, setLocalMicThreshold] = useState(0);
  const [localEchoCancellation, setLocalEchoCancellation] = useState(false);
  const [localVoiceMode, setLocalVoiceMode] = useState<"activity" | "ptt" | "toggle">("activity");
  const [localPttKeybind, setLocalPttKeybind] = useState("KeyV");

  const isModalOpen = isOpen && type === "userSettings";

  useEffect(() => {
    if (data.user && isModalOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImageUrl(data.user.image || "");
      setStatusText(data.user.statusText || "");
      setIsSuperAdmin(data.user.isSuperAdmin || false);
      setLocalMicThreshold(useSettingsStore.getState().micThreshold);
      setLocalEchoCancellation(useSettingsStore.getState().echoCancellation);
      setLocalVoiceMode(useSettingsStore.getState().voiceMode);
      setLocalPttKeybind(useSettingsStore.getState().pttKeybind);
    }
  }, [data.user, isModalOpen]);

  if (!isModalOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const onSave = async () => {
    try {
      setIsLoading(true);
      // Save local voice settings to zustand store immediately
      setMicThreshold(localMicThreshold);
      setEchoCancellation(localEchoCancellation);
      setVoiceModeStore(localVoiceMode);
      setPttKeybindStore(localPttKeybind);

      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl, statusText, isSuperAdmin }),
      });
      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/sign-in" });
  };

  const hasChanges = 
    imageUrl !== (data.user?.image || "") || 
    statusText !== (data.user?.statusText || "") || 
    isSuperAdmin !== (data.user?.isSuperAdmin || false) ||
    localMicThreshold !== micThreshold ||
    localEchoCancellation !== echoCancellation ||
    localVoiceMode !== voiceMode ||
    localPttKeybind !== pttKeybind;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="w-full max-w-md rounded-lg bg-discord-channel p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">User Settings</h2>
          <button onClick={handleClose} className="text-discord-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-discord-muted">
            Profile Picture
          </label>
          <div className="flex items-center justify-center mb-4">
            <FileUpload
              endpoint="userImage"
              value={imageUrl}
              onChange={(url) => {
                setImageUrl(url || "");
              }}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-discord-muted">
            Custom Status
          </label>
          <div className="flex items-center rounded-sm bg-discord-darker p-1 transition-all focus-within:ring-1 focus-within:ring-campfire-blue">
            <input
              disabled={isLoading}
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={100}
              className="flex-1 bg-transparent p-2 text-sm text-discord-text outline-none"
            />
          </div>
        </div>

        {data.user?.name === "blackmamba" && (
          <div className="mb-6">
            <div className="flex items-center justify-between bg-black/20 p-4 rounded-md border border-discord-red/50">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-discord-red uppercase">SAUCE IT UP</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isSuperAdmin}
                  onChange={(e) => setIsSuperAdmin(e.target.checked)}
                  disabled={isLoading}
                />
                <div className="w-11 h-6 bg-discord-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-discord-red"></div>
              </label>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="mb-4 block text-xs font-bold uppercase tracking-wide text-discord-muted">
            Voice Settings
          </label>
          <div className="space-y-4 bg-black/20 p-4 rounded-md">
            
            <div className="flex flex-col gap-y-2">
              <span className="text-sm font-semibold text-discord-text">Input Mode</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setLocalVoiceMode("activity")}
                  className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 text-xs transition-colors ${
                    localVoiceMode === "activity" ? "bg-campfire-blue text-white" : "bg-discord-dark text-discord-muted hover:bg-black/40 hover:text-white"
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  Voice Activity
                </button>
                <button
                  onClick={() => setLocalVoiceMode("ptt")}
                  className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 text-xs transition-colors ${
                    localVoiceMode === "ptt" ? "bg-campfire-blue text-white" : "bg-discord-dark text-discord-muted hover:bg-black/40 hover:text-white"
                  }`}
                >
                  <Keyboard className="h-4 w-4" />
                  Push to Talk
                </button>
                <button
                  onClick={() => setLocalVoiceMode("toggle")}
                  className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 text-xs transition-colors ${
                    localVoiceMode === "toggle" ? "bg-campfire-blue text-white" : "bg-discord-dark text-discord-muted hover:bg-black/40 hover:text-white"
                  }`}
                >
                  <Mic className="h-4 w-4" />
                  Toggle Mute
                </button>
              </div>
            </div>

            {(localVoiceMode === "ptt" || localVoiceMode === "toggle") && (
              <div className="flex flex-col gap-y-2 pt-2 border-t border-discord-dark">
                <span className="text-sm font-semibold text-discord-text">Shortcut Key</span>
                <KeybindRecorder value={localPttKeybind} onChange={setLocalPttKeybind} />
              </div>
            )}

            <div className={`pt-2 ${localVoiceMode === "activity" ? "border-t border-discord-dark" : ""}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-discord-text">Input Sensitivity</span>
                <span className="text-xs text-discord-muted font-mono">{Math.round(localMicThreshold * 100)}%</span>
              </div>
              <p className="text-xs text-discord-muted mb-3 leading-relaxed">
                Automatically determines when your voice is transmitted. If your green ring is constantly lit up by background noise, slide this slightly to the right.
              </p>
              <div className="flex items-center gap-x-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={localMicThreshold}
                  onChange={(e) => setLocalMicThreshold(parseFloat(e.target.value))}
                  className="w-full h-2 bg-discord-dark rounded-lg appearance-none cursor-pointer accent-campfire-blue"
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between bg-black/20 p-3 rounded-md border border-discord-dark">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-discord-text">Echo Cancellation</span>
                  <span className="text-xs text-discord-muted">Prevents your mic from picking up audio from your speakers.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={localEchoCancellation}
                    onChange={(e) => setLocalEchoCancellation(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-discord-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            </div>
            
            <MicTester />
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-discord-dark pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-sm bg-transparent px-4 py-2 text-sm font-medium text-discord-red transition hover:bg-discord-red/10"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
          
          <div className="flex justify-end gap-x-2">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-sm px-4 py-2 text-sm font-medium text-discord-text hover:underline"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isLoading || !hasChanges}
              className="rounded-sm bg-campfire-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-campfire-blue/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
