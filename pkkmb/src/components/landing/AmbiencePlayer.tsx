"use client";

import { useAmbience } from "@/context/AmbienceContext";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Synthetic Ambient Audio Player Button.
 * Consumes global AmbienceContext to allow seamless continuous playback across pages.
 */
export default function AmbiencePlayer() {
  const { isPlaying, toggleAmbience } = useAmbience();

  return (
    <button
      onClick={toggleAmbience}
      aria-label={isPlaying ? "Matikan Musik Ambience" : "Putar Musik Ambience"}
      className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-full bg-[#040507]/60 hover:bg-[#D4AF37]/15 text-[#D4AF37] text-xs font-mono transition-all border border-[#D4AF37]/35 backdrop-blur-md shadow-md cursor-pointer shrink-0"
    >
      {isPlaying ? (
        <>
          <Volume2 className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse shrink-0" />
          <span className="hidden sm:inline text-[10px] tracking-widest font-bold">AMBIENCE ON</span>
        </>
      ) : (
        <>
          <VolumeX className="w-3.5 h-3.5 opacity-70 shrink-0" />
          <span className="hidden sm:inline text-[10px] tracking-widest opacity-70">AMBIENCE OFF</span>
        </>
      )}
    </button>
  );
}
