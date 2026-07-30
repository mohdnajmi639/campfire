"use client";

import { useCallback } from "react";

export function useAudioIndicator() {
  const playSound = useCallback((type: "join" | "leave" | "mute" | "unmute") => {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";

      const now = ctx.currentTime;

      if (type === "join") {
        // Ascending bloop
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      } else if (type === "leave") {
        // Descending bloop
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      } else if (type === "mute") {
        // Double descending beep
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.setValueAtTime(250, now + 0.15); 
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        
        gain.gain.setValueAtTime(0, now + 0.15);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.17);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
      } else if (type === "unmute") {
        // Double ascending beep
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.setValueAtTime(450, now + 0.15);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        
        gain.gain.setValueAtTime(0, now + 0.15);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.17);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
      }

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (error) {
      console.warn("Audio indicator failed:", error);
    }
  }, []);

  return { playSound };
}
