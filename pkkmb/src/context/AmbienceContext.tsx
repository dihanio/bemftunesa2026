"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

interface AmbienceContextType {
  isPlaying: boolean;
  toggleAmbience: () => Promise<void>;
}

const AmbienceContext = createContext<AmbienceContextType | undefined>(undefined);

export function AmbienceProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Play rich resonant gamelan chime (dual overtone dyad)
  const playPentatonicChime = (ctx: AudioContext) => {
    if (!isPlayingRef.current) return;

    // Slendro / Pelog scale frequencies (Hz)
    const scale = [146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
    const baseFreq = scale[Math.floor(Math.random() * scale.length)];
    const overtoneFreq = baseFreq * 1.5;

    const now = ctx.currentTime;

    // Main Resonant Bell Oscillator
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(baseFreq, now);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.15); // Peak gain 0.18
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Metallic Overtone Oscillator
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(overtoneFreq, now);

    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.linearRampToValueAtTime(0.09, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 4.6);
    osc2.stop(now + 3.1);
  };

  // Continuous Warm Low Drone Bed
  const startContinuousDrone = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(146.83, ctx.currentTime);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2.0);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    droneGainRef.current = gain;
  };

  const toggleAmbience = async () => {
    if (isPlaying) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (droneGainRef.current && audioCtxRef.current) {
        droneGainRef.current.gain.linearRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.5);
      }
      setTimeout(async () => {
        if (audioCtxRef.current && audioCtxRef.current.state === "running") {
          await audioCtxRef.current.suspend();
        }
      }, 550);
    } else {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      isPlayingRef.current = true;
      setIsPlaying(true);

      startContinuousDrone(audioCtxRef.current);
      playPentatonicChime(audioCtxRef.current);

      timerRef.current = setInterval(() => {
        if (audioCtxRef.current && isPlayingRef.current) {
          playPentatonicChime(audioCtxRef.current);
        }
      }, 2800);
    }
  };

  return (
    <AmbienceContext.Provider value={{ isPlaying, toggleAmbience }}>
      {children}
    </AmbienceContext.Provider>
  );
}

export function useAmbience() {
  const context = useContext(AmbienceContext);
  if (!context) {
    throw new Error("useAmbience must be used within an AmbienceProvider");
  }
  return context;
}
