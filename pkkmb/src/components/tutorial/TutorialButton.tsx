"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";

/**
 * Tombol untuk membuka tutorial interaktif kapan saja.
 * Diklik → menaikkan `triggerKey` yang diteruskan ke <InteractiveTutorial />.
 */
export default function TutorialButton({
  onTrigger,
  label = "Panduan",
  className = "",
}: {
  onTrigger: () => void;
  label?: string;
  className?: string;
}) {
  const [pulse, setPulse] = useState(false);
  return (
    <button
      onClick={() => {
        setPulse(true);
        setTimeout(() => setPulse(false), 400);
        onTrigger();
      }}
      className={`group inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 text-sm font-bold transition-all duration-300 active:scale-95 ${
        pulse ? "scale-95" : ""
      } ${className}`}
      aria-label="Buka panduan interaktif"
    >
      <GraduationCap className="w-4 h-4 transition-transform group-hover:rotate-12" />
      {label}
    </button>
  );
}
