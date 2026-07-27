"use client";

import { useAmbience } from "@/context/AmbienceContext";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Synthetic Ambient Audio Player Button.
 * Features both desktop pill format and mobile compact circular mode.
 */
export default function AmbiencePlayer() {
  const { isPlaying, toggleAmbience } = useAmbience();

  return (
    <button
      onClick={toggleAmbience}
      aria-label={isPlaying ? "Matikan Musik Ambience" : "Putar Musik Ambience"}
      title={isPlaying ? "Ambience Audio: Active" : "Ambience Audio: Muted"}
      className={`inline-flex items-center justify-center gap-2 rounded-full transition-all border backdrop-blur-md shadow-md cursor-pointer shrink-0 ${
        isPlaying
          ? "w-9 h-9 sm:w-auto sm:px-4 sm:h-10 bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/60 shadow-[0_0_12px_rgba(212,175,55,0.25)]"
          : "w-9 h-9 sm:w-auto sm:px-4 sm:h-10 bg-[#040507]/60 hover:bg-[#D4AF37]/10 text-[#8E8E93] hover:text-[#D4AF37] border-[#D4AF37]/25"
      }`}
    >
      {isPlaying ? (
        <>
          <div className="relative flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4 text-[#D4AF37] animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping sm:hidden" />
          </div>
          <span className="hidden sm:inline text-[10px] font-mono tracking-widest font-bold uppercase">
            AMBIENCE ON
          </span>
        </>
      ) : (
        <>
          <VolumeX className="w-4 h-4 opacity-70 shrink-0" />
          <span className="hidden sm:inline text-[10px] font-mono tracking-widest opacity-70 uppercase">
            AMBIENCE OFF
          </span>
        </>
      )}
    </button>
  );
}
