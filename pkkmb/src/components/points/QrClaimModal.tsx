"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  ScanLine,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Camera,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import toast from "react-hot-toast";

// jsQR dimuat SEKALI (lazy) — dipakai untuk decode frame kamera & file foto.
const jsQRPromise = import("jsqr").then((m) => m.default);

// Decode QR dari file gambar via jsQR (pola sama seperti onboarding KTMS).
async function decodeQrFromImage(file: File): Promise<string | null> {
  const jsQR = await jsQRPromise;
  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const code = jsQR(imageData.data, width, height);
  return code ? code.data : null;
}

interface ClaimResult {
  points: number;
  title: string;
  totalPoints: number;
}

export default function QrClaimModal({
  onClose,
  onClaimed,
}: {
  onClose: () => void;
  onClaimed: (result: ClaimResult) => void;
}) {
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [submitting, setSubmitting] = useState(false);
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
  const [manualCode, setManualCode] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const decodeBusyRef = useRef(false);
  // Error kamera + counter utk tombol "Coba Lagi" (restart efek scan).
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanAttempt, setScanAttempt] = useState(0);

  const doClaim = useCallback(
    async (code: string) => {
      if (!code.trim()) {
        toast.error("Masukkan kode dari QR terlebih dahulu.");
        return;
      }
      setSubmitting(true);
      try {
        const res = await apiFetch("/pkkmb/qr-points/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: code.trim() }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal mengklaim poin.");
        }
        setClaimResult({
          points: json.data.points,
          title: json.data.title,
          totalPoints: json.data.totalPoints,
        });
        onClaimed(json.data);
      } catch (error: unknown) {
        toast.error((error as Error).message);
      } finally {
        setSubmitting(false);
      }
    },
    [onClaimed],
  );

  // ─── LIVE SCAN: nyalakan kamera belakang saat mode "scan" aktif ──────────
  // Kamera dibuka langsung (bukan upload file). Frame video di-decode via
  // jsQR secara berkala; begitu QR terbaca → klaim otomatis & kamera berhenti.
  useEffect(() => {
    if (mode !== "scan" || claimResult) return;
    let cancelled = false;
    let raf = 0;
    let lastDecode = 0;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const stop = () => {
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };

    const loop = async (video: HTMLVideoElement) => {
      if (cancelled) return;
      if (!video.videoWidth || !ctx) {
        raf = requestAnimationFrame(() => loop(video));
        return;
      }
      const now = Date.now();
      if (now - lastDecode > 300 && !decodeBusyRef.current) {
        lastDecode = now;
        decodeBusyRef.current = true;
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const jsQR = await jsQRPromise;
          const code = jsQR(img.data, img.width, img.height);
          if (code && code.data) {
            stop();
            cancelled = true;
            void doClaim(code.data);
            return;
          }
        } catch {
          /* frame gagal di-decode — coba frame berikutnya */
        } finally {
          decodeBusyRef.current = false;
        }
      }
      raf = requestAnimationFrame(() => loop(video));
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play().catch(() => {});
        setScanError(null);
        raf = requestAnimationFrame(() => loop(video));
      } catch {
        if (!cancelled) {
          setScanError(
            "Kamera tidak dapat diakses. Izinkan akses kamera, lalu coba lagi — atau gunakan opsi pilih foto.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, claimResult, scanAttempt]);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setSubmitting(true);
    try {
      const text = await decodeQrFromImage(file);
      if (!text) {
        toast.error(
          "Tidak ada kode QR yang terbaca pada gambar. Coba foto yang lebih jelas.",
        );
        return;
      }
      await doClaim(text);
    } catch {
      toast.error(
        "Gagal membaca kode QR dari gambar. Coba lagi atau masukkan kode manual.",
      );
    } finally {
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="font-display font-bold text-lg">Klaim Poin QR</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {claimResult ? (
          // ── Layar sukses ──
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="font-display font-bold text-2xl text-white">
              Poin Berhasil Diklaim!
            </h3>
            <p className="text-sm text-white/70 mt-2">{claimResult.title}</p>
            <div className="mt-6 bg-gold-500/10 border border-gold-500/20 rounded-2xl py-5">
              <p className="text-xs uppercase tracking-wider text-gold-500/70 font-bold">
                Poin Ditambahkan
              </p>
              <p className="font-display text-4xl font-black text-gold-400 mt-1">
                +{claimResult.points}
              </p>
            </div>
            <p className="text-xs text-white/50 mt-4">
              Total poin kamu sekarang:{" "}
              <span className="font-bold text-white">
                {claimResult.totalPoints}
              </span>
            </p>
            <button
              onClick={onClose}
              className="mt-8 w-full px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl transition-colors"
            >
              Selesai
            </button>
          </div>
        ) : (
          <div className="p-6">
            {/* Pilihan mode */}
            <div className="flex gap-2 mb-5">
              {([
                {
                  key: "scan",
                  label: "Scan QR",
                  icon: <ScanLine className="w-4 h-4" />,
                },
                {
                  key: "manual",
                  label: "Ketik Kode",
                  icon: <KeyRound className="w-4 h-4" />,
                },
              ] as const).map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                    mode === m.key
                      ? "bg-gold-500/10 border-gold-500 text-gold-400"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>

            {mode === "scan" ? (
              scanError ? (
                // ── Kamera gagal: error + opsi ulangi / pilih foto ──
                <div>
                  <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm mb-4">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{scanError}</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setScanError(null);
                        setScanAttempt((a) => a + 1);
                      }}
                      className="flex-1 px-4 py-3 bg-gold-500 hover:bg-gold-400 text-black rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> Coba Lagi
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl font-bold border border-white/10 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Camera className="w-4 h-4" /> Pilih Foto
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>
              ) : (
                // ── Kamera live ──
                <div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Frame panduan scan */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-3/4 h-3/4 border-2 border-gold-500/70 rounded-2xl" />
                    </div>
                    <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-full px-3 py-1 text-[11px] text-white/80">
                        <ScanLine className="w-3.5 h-3.5 text-gold-400" />
                        Arahkan ke QR kartu
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting}
                    className="mt-3 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/70 text-sm font-semibold hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    Pilih Foto sebagai Gantinya
                  </button>
                  <div className="mt-3 flex items-start gap-2 p-3 bg-gold-500/5 border border-gold-500/15 rounded-xl text-xs text-white/50">
                    <AlertCircle className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                    <span>
                      Pastikan seluruh QR terlihat dalam satu frame &amp; tidak
                      buram agar terbaca sempurna.
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>
              )
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void doClaim(manualCode);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">
                    Kode di Kartu QR
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="contoh: PKKMBQ_AB12CD"
                    className="w-full px-4 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500 font-mono tracking-wider"
                  />
                  <p className="text-[11px] text-white/40 mt-2">
                    Kode tercetak di bawah QR pada kartu — berguna jika kamera
                    bermasalah.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !manualCode.trim()}
                  className="w-full px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Memproses...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-5 h-5" /> Klaim Poin
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
