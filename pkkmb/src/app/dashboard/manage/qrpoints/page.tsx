"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  QrCode,
  Clock,
  X,
  Printer,
  AlertTriangle,
  Loader2,
  Copy,
} from "lucide-react";
import QRCode from "react-qr-code";
import { apiFetch } from "@/lib/api";
import { formatWIB, useNow } from "@/lib/presensi-time";
import toast from "react-hot-toast";

interface QrPoint {
  _id: string;
  title: string;
  points: number;
  code: string;
  status: "ACTIVE" | "CLOSED";
  startTime: string;
  endTime: string;
  createdAt: string;
}

export default function ManageQrPointsPage() {
  const [items, setItems] = useState<QrPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [showQr, setShowQr] = useState<QrPoint | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [points, setPoints] = useState("");
  const [hours, setHours] = useState("24");
  const [creating, setCreating] = useState(false);
  const now = useNow();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/pkkmb/qr-points");
      if (res.ok) {
        const json = await res.json();
        if (json.success) setItems(json.data || []);
      }
    } catch {
      toast.error("Gagal memuat daftar QR poin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- inisialisasi state awal halaman (pola sama dgn halaman lain)
    void fetchList();
  }, [fetchList]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const pts = parseInt(points, 10);
    const h = parseFloat(hours);
    if (!title.trim() || !Number.isFinite(pts) || pts <= 0) {
      toast.error("Lengkapi judul dan poin (angka > 0).");
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = { title: title.trim(), points: pts };
      if (Number.isFinite(h) && h > 0) {
        const start = new Date();
        const end = new Date(start.getTime() + h * 3600 * 1000);
        body.startTime = start.toISOString();
        body.endTime = end.toISOString();
      }
      const res = await apiFetch("/pkkmb/qr-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal membuat sesi QR.");
      toast.success("Sesi QR poin dibuat! Silakan cetak QR.");
      setTitle("");
      setPoints("");
      setHours("24");
      setCreateOpen(false);
      await fetchList();
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = async (id: string) => {
    try {
      const res = await apiFetch(`/pkkmb/qr-points/${id}/close`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal menutup sesi.");
      toast.success("Sesi QR poin ditutup.");
      await fetchList();
    } catch (error: unknown) {
      toast.error((error as Error).message);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Kode ${code} disalin`);
    } catch {
      toast.error("Gagal menyalin kode.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">QR Poin Keaktifan</h1>
          <p className="text-white/60 mt-1 max-w-xl">
            Buat sesi QR poin untuk maba yang tidak bisa hadir fisik (offline).
            QR dicetak lalu ditempel/dibagikan — semua maba yang scan mendapat
            poin, maksimal 1× per maba per sesi.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-black rounded-xl font-bold text-sm transition-colors shadow-[0_0_20px_rgba(234,179,8,0.2)] shrink-0"
        >
          <Plus className="w-4 h-4" /> Buat Sesi QR
        </button>
      </div>

      {/* Daftar sesi */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl">
          <QrCode className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white/50">Belum Ada Sesi QR</h3>
          <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto">
            Buat sesi pertama untuk mulai memberikan poin ke maba yang offline.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((item) => {
            const isActive = item.status === "ACTIVE" && now >= +new Date(item.startTime) && now <= +new Date(item.endTime);
            return (
              <div
                key={item._id}
                className={`bg-black/40 backdrop-blur-md border rounded-3xl p-5 transition-all ${
                  item.status === "ACTIVE" ? "border-white/10" : "border-white/5 opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-white truncate">{item.title}</h3>
                    <p className="text-xs text-white/40 mt-0.5">Kode: {item.code}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full border shrink-0 ${
                      isActive
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : item.status === "ACTIVE"
                          ? "bg-gold-500/10 border-gold-500/30 text-gold-400"
                          : "bg-white/5 border-white/10 text-white/40"
                    }`}
                  >
                    {isActive ? "Aktif" : item.status === "ACTIVE" ? "Belum/Tutup" : "Ditutup"}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl px-4 py-2">
                    <span className="font-display text-2xl font-black text-gold-400">+{item.points}</span>
                    <span className="text-[10px] text-gold-500/60 uppercase ml-1 font-bold">poin</span>
                  </div>
                  <div className="text-xs text-white/40 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatWIB(item.startTime, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      s.d. {formatWIB(item.endTime, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowQr(item)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-black rounded-xl font-bold text-sm transition-colors"
                  >
                    <QrCode className="w-4 h-4" /> Lihat QR
                  </button>
                  <button
                    onClick={() => copyCode(item.code)}
                    className="inline-flex items-center justify-center px-3 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl border border-white/10 transition-colors"
                    title="Salin kode"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {item.status === "ACTIVE" && (
                    <button
                      onClick={() => handleClose(item._id)}
                      className="inline-flex items-center justify-center px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-colors"
                      title="Tutup sesi"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal buat sesi */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="font-display font-bold text-lg">Buat Sesi QR Poin</h3>
              <button onClick={() => setCreateOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/60">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Judul Kegiatan</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="contoh: Games PKKMB — Ice Breaking"
                  className="w-full px-4 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Poin</label>
                  <input
                    type="number"
                    min={1}
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder="10"
                    className="w-full px-4 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Berlaku (jam)</label>
                  <input
                    type="number"
                    min={1}
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="24"
                    className="w-full px-4 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-gold-500/5 border border-gold-500/15 rounded-xl text-xs text-white/50">
                <AlertTriangle className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <span>
                  Setelah dibuat, QR otomatis aktif. Cetak &amp; tempel — maba yang offline bisa
                  scan dari mana saja. Setiap maba hanya bisa klaim 1× per sesi.
                </span>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Membuat...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" /> Buat &amp; Generate QR
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal QR (siap cetak) */}
      {showQr && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-[#0a0a0a] flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="font-display font-bold text-lg text-white">QR Siap Cetak</h3>
              <button onClick={() => setShowQr(null)} className="p-2 rounded-lg hover:bg-white/10 text-white/60">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center bg-white">
              <p className="text-black font-bold text-center mb-4">{showQr.title}</p>
              <p className="text-black/60 text-xs mb-5 text-center">
                Scan untuk mendapat <span className="font-bold text-black">+{showQr.points} poin</span>
              </p>
              <div className="p-4 border-2 border-black/10 rounded-2xl">
                <QRCode value={showQr.code} size={200} level="H" />
              </div>
              <p className="mt-4 font-mono text-xs text-black/70 tracking-widest bg-black/5 px-3 py-1.5 rounded-lg">
                {showQr.code}
              </p>
              <div className="flex gap-2 mt-6 w-full">
                <button
                  onClick={() => copyCode(showQr.code)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black/5 hover:bg-black/10 text-black rounded-xl font-bold text-sm border border-black/10 transition-colors"
                >
                  <Copy className="w-4 h-4" /> Salin Kode
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-black/80 text-white rounded-xl font-bold text-sm transition-colors"
                >
                  <Printer className="w-4 h-4" /> Cetak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
