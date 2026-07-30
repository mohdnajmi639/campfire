"use client";

import { useEffect, useRef, useState } from "react";
import { useSettingsStore } from "@/hooks/use-settings-store";

export function MicTester() {
  const [isTesting, setIsTesting] = useState(false);
  const [volume, setVolume] = useState(0);
  const micThreshold = useSettingsStore((s) => s.micThreshold);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!isTesting) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setVolume(0);
      return;
    }

    let isMounted = true;

    async function startMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) return;
        streamRef.current = stream;
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0; // Start muted

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          if (!isMounted) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Normalize to roughly 0-1 (128 is a good max for normal speaking)
          const normalizedVol = Math.min(avg / 128, 1);
          setVolume(normalizedVol);
          
          // Apply noise gate to the loopback so they hear exactly what others hear
          const currentThreshold = useSettingsStore.getState().micThreshold;
          if (normalizedVol > currentThreshold) {
            gainNode.gain.setTargetAtTime(1, audioCtx.currentTime, 0.05);
          } else {
            gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
          }
          
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        
        updateVolume();
      } catch (err) {
        console.error("Failed to access mic", err);
        setIsTesting(false);
      }
    }

    startMic();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTesting]);

  const isSpeaking = volume > micThreshold;

  return (
    <div className="space-y-3 mt-4 border-t border-discord-dark pt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-discord-text">Mic Test</span>
        <button
          onClick={() => setIsTesting(!isTesting)}
          className="rounded-sm border border-campfire-blue bg-transparent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-campfire-blue/20"
        >
          {isTesting ? "Stop Testing" : "Let's Check"}
        </button>
      </div>
      
      <p className="text-xs text-discord-muted leading-relaxed">
        Let's make sure your mic is working correctly. Click the button above to test.
      </p>

      <div className="relative h-6 w-full rounded-md bg-black/40 overflow-hidden border border-discord-dark">
        {/* Threshold marker */}
        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-white z-10 shadow-sm" 
          style={{ left: `${micThreshold * 100}%` }}
        />
        
        {/* Volume fill */}
        <div 
          className={`absolute top-0 bottom-0 left-0 transition-all duration-75 ${isSpeaking ? 'bg-green-500' : 'bg-discord-light'}`}
          style={{ width: `${volume * 100}%` }}
        />
      </div>
    </div>
  );
}
