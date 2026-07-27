"use client";

import { useAmbience } from "@/context/AmbienceContext";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Synthetic Ambient Audio Player Button (Compact Icon Only).
 * Minimal luxury circular button across all screen sizes.
 */
export default function AmbiencePlayer() {
  const { isPlaying, toggleAmbience } = useAmbience();

  return (
    <button
      onClick={toggleAmbience}
      aria-label={isPlaying ? "Matikan Musik Ambience" : "Putar Musik Ambience"}
      title={isPlaying ? "Ambience Audio: Active (Click to Mute)" : "Ambience Audio: Muted (Click to Play)"}
      className={`relative inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all border backdrop-blur-md shadow-md cursor-pointer shrink-0 ${
        isPlaying
          ? "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/60 shadow-[0_0_12px_rgba(212,175,55,0.3)] hover:bg-[#D4AF37]/25"
          : "bg-[#040507]/60 hover:bg-[#D4AF37]/10 text-[#8E8E93] hover:text-[#D4AF37] border-[#D4AF37]/25 hover:border-[#D4AF37]/40"
      }`}
    >
      {isPlaying ? (
        <div className="relative flex items-center justify-center">
          <Volume2 className="w-4 h-4 text-[#D4AF37] animate-pulse" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping" />
        </div>
      ) : (
        <VolumeX className="w-4 h-4 opacity-70" />
      )}
    </button>
  );
}
