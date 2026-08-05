"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Ganti tanggal ini sesuai Hari-H PKKMB 2026
const PKKMB_DATE = new Date("2026-08-17T07:00:00+07:00");

function calculateTimeLeft(): TimeLeft {
  const diff = PKKMB_DATE.getTime() - new Date().getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

interface CountdownUnitProps {
  value: number;
  label: string;
}

function CountdownUnit({ value, label }: CountdownUnitProps) {
  const prev = useRef(value);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      setFlip(true);
      prev.current = value;
      const t = setTimeout(() => setFlip(false), 300);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="glass rounded-xl px-4 py-3 min-w-[64px] text-center relative overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: flip ? -20 : 0, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="block font-display font-bold text-2xl md:text-3xl text-white tabular-nums"
            style={{ textShadow: "0 0 12px rgba(245,158,11,0.5)" }}
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-xs text-emerald-300/70 uppercase tracking-widest font-body font-medium">
        {label}
      </span>
    </div>
  );
}

export default function CountdownWidget() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const isOver =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  if (isOver) {
    return (
      <div className="glass rounded-2xl px-6 py-4 text-center">
        <p className="font-display font-bold text-lg gradient-emerald-gold">
          PKKMB 2026 Telah Dimulai!
        </p>
        <p className="text-emerald-300/70 text-sm mt-1">Salam Rumah Kita Insinyur Muda! 🏆</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-white/70 uppercase tracking-[0.2em] font-body">
        Menuju Hari-H PKKMB FT UNESA 2026
      </p>
      <div className="flex items-start gap-3">
        <CountdownUnit value={timeLeft.days} label="Hari" />
        <span className="font-display font-bold text-2xl text-gold-500 mt-3 opacity-60">:</span>
        <CountdownUnit value={timeLeft.hours} label="Jam" />
        <span className="font-display font-bold text-2xl text-gold-500 mt-3 opacity-60">:</span>
        <CountdownUnit value={timeLeft.minutes} label="Menit" />
        <span className="font-display font-bold text-2xl text-gold-500 mt-3 opacity-60">:</span>
        <CountdownUnit value={timeLeft.seconds} label="Detik" />
      </div>
    </div>
  );
}
