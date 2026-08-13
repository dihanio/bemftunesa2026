"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, HelpCircle, Check } from "lucide-react";

export interface TutorialStep {
  /** CSS selector elemen target yang akan di-highlight. */
  selector?: string;
  /** Icon judul (opsional). */
  icon?: React.ReactNode;
  title: string;
  description: string;
  /** Posisi tooltip relatif terhadap elemen target. */
  placement?: "top" | "bottom" | "left" | "right" | "center";
}

export interface TutorialConfig {
  /** Kunci unik untuk menyimpan status "sudah pernah dilihat" di localStorage. */
  storageKey: string;
  steps: TutorialStep[];
}

interface Bounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Ukuran padding (px) di sekitar elemen target agar highlight terlihat jelas.
const SPOTLIGHT_PAD = 10;

export default function InteractiveTutorial({
  config,
  autoShow = true,
  triggerKey,
  onFinish,
}: {
  config: TutorialConfig;
  autoShow?: boolean;
  /** Nilai ini mengubah (increment) untuk memicu tampil dari luar (tombol manual). */
  triggerKey?: number;
  onFinish?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const total = config.steps.length;

  // Key penanda "sudah pernah lihat" per tutorial.
  const seenKey = useMemo(() => `pkkmb:tutorial:${config.storageKey}`, [config.storageKey]);

  const updateBounds = useCallback(() => {
    const step = config.steps[stepIndex];
    if (!step?.selector) {
      setBounds(null);
      return;
    }
    const el = document.querySelector(step.selector);
    if (!el) {
      setBounds(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setBounds({
      top: Math.max(0, r.top - SPOTLIGHT_PAD),
      left: Math.max(0, r.left - SPOTLIGHT_PAD),
      width: r.width + SPOTLIGHT_PAD * 2,
      height: r.height + SPOTLIGHT_PAD * 2,
    });
  }, [config.steps, stepIndex]);

  // Update ukuran viewport & bounds saat resize/scroll.
  useEffect(() => {
    if (!open) return;
    const update = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      updateBounds();
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, updateBounds]);

  // Auto-show sekali (kalau belum pernah lihat) — pakai guard supaya tidak
  // memunculkan berulang saat state berubah.
  useEffect(() => {
    if (!autoShow) return;
    let seen = false;
    try {
      seen = localStorage.getItem(seenKey) === "1";
    } catch {}
    if (!seen && config.steps.length > 0) {
      // delay kecil agar elemen target sudah ter-render.
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoShow]);

  // Trigger manual dari tombol (triggerKey berubah).
  useEffect(() => {
    if (typeof triggerKey === "number" && triggerKey > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- buka tutorial & reset ke langkah awal saat tombol manual diklik
      setStepIndex(0);
      setOpen(true);
    }
  }, [triggerKey]);

  // Pindah langkah → update bounds.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- perbarui posisi spotlight saat langkah/status berubah
    if (open) updateBounds();
  }, [open, stepIndex, updateBounds]);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(seenKey, "1");
    } catch {}
    onFinish?.();
  }, [seenKey, onFinish]);

  const next = useCallback(() => {
    if (stepIndex < total - 1) {
      setStepIndex((i) => i + 1);
    } else {
      close();
    }
  }, [stepIndex, total, close]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const step = config.steps[stepIndex];
  const isLast = stepIndex === total - 1;

  // Hitung posisi tooltip berdasarkan placement.
  const tooltipPos = useMemo(() => {
    if (!bounds) return { x: 0, y: 0 };
    const { placement = "bottom" } = step || {};
    if (placement === "center") {
      return {
        x: viewport.width / 2 - 180,
        y: viewport.height / 2 - 120,
      };
    }
    const w = 360; // lebar tooltip (max)
    let x = bounds.left + bounds.width / 2 - w / 2;
    let y = 0;
    if (placement === "top") y = bounds.top - 12 - 140;
    else if (placement === "bottom") y = bounds.top + bounds.height + 16;
    else if (placement === "left") {
      x = bounds.left - 16 - w;
      y = bounds.top + bounds.height / 2 - 80;
    } else {
      x = bounds.left + bounds.width + 16;
      y = bounds.top + bounds.height / 2 - 80;
    }
    // Jaga tooltip tetap di dalam layar.
    x = Math.max(12, Math.min(x, viewport.width - w - 12));
    y = Math.max(12, Math.min(y, viewport.height - 140));
    return { x, y };
  }, [bounds, step, viewport]);

  if (!open || !step) return null;

  // Gaya spotlight: potongan lubang di overlay gelap.
  const hole =
    bounds && step.selector
      ? `polygon(
        0 0, 0 100%, ${bounds.left}px 100%, ${bounds.left}px ${bounds.top}px,
        ${bounds.left + bounds.width}px ${bounds.top}px,
        ${bounds.left + bounds.width}px ${bounds.top + bounds.height}px,
        ${bounds.left}px ${bounds.top + bounds.height}px,
        ${bounds.left}px 100%, 100% 100%, 100% 0)`
      : "none";

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay gelap dengan lubang (spotlight) pada elemen target */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/75"
        style={{
          clipPath: hole,
          WebkitClipPath: hole,
        }}
        onClick={next}
      />

      {/* Border emas mengelilingi elemen target */}
      {bounds && step.selector && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute rounded-2xl border-2 border-gold-500 shadow-[0_0_0_4px_rgba(234,179,8,0.25),0_0_40px_rgba(234,179,8,0.35)] pointer-events-none"
          style={{
            top: bounds.top,
            left: bounds.left,
            width: bounds.width,
            height: bounds.height,
          }}
        />
      )}

      {/* Tooltip konten tutorial */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="fixed z-10 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            width: 360,
            maxWidth: "calc(100vw - 24px)",
          }}
        >
          <div className="h-1 bg-gradient-to-r from-gold-500 to-amber-500" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400">
                  {step.icon || (
                    <HelpCircle className="w-4 h-4" />
                  )}
                </span>
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                  {stepIndex + 1}/{total}
                </span>
              </div>
              <button
                onClick={close}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Tutup tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-display font-bold text-lg text-white mb-2">{step.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed mb-5">{step.description}</p>

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {config.steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStepIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === stepIndex ? "w-6 bg-gold-500" : "w-1.5 bg-white/20"
                    }`}
                    aria-label={`Langkah ${i + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {stepIndex > 0 && (
                  <button
                    onClick={prev}
                    className="px-3 py-2 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Kembali
                  </button>
                )}
                <button
                  onClick={next}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gold-500 hover:bg-gold-400 text-black transition-colors flex items-center gap-1.5"
                >
                  {isLast ? (
                    <>
                      Selesai <Check className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Lanjut <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
