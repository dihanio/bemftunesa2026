"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Clock, MapPin, Search, Fingerprint, AlertCircle, Camera, X, User, Lock } from "lucide-react";
import { API_URL } from "@/lib/api";
import { formatWIB, formatWIBLong, getPeriodStatus, useNow } from "@/lib/presensi-time";
import toast from "react-hot-toast";

interface Session {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status?: string;
}

interface AttendanceRecord {
  _id: string;
  session: Session;
  checkInTime: string;
  status: string;
  attendanceMethod: string;
  notes?: string;
  proofUrl?: string;
  reason?: string;
  izinStatus?: string;
}

interface ParticipantInfo {
  name: string;
  nim: string;
}

export default function PresensiMabaPage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const now = useNow();
  
  // Form State
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Kamera
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [participant, setParticipant] = useState<ParticipantInfo>({ name: "", nim: "" });

  // Izin / Sakit
  const [izinOpen, setIzinOpen] = useState(false);
  const [izinType, setIzinType] = useState<"Izin" | "Sakit">("Izin");
  const [izinReason, setIzinReason] = useState("");
  const [izinProof, setIzinProof] = useState<File | null>(null);
  const [izinSubmitting, setIzinSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [histRes, sessRes, meRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/pkkmb/attendance/my-history`, { credentials: "include" }),
        fetch(`${API_URL}/api/v1/pkkmb/attendance/sessions?status=PUBLISHED`, { credentials: "include" }),
        fetch(`${API_URL}/api/v1/auth/me`, { credentials: "include" })
      ]);

      const histJson = await histRes.json();
      const sessJson = await sessRes.json();
      const meJson = await meRes.json();

      if (histJson.success && histJson.data) {
        setHistory(histJson.data);
      }

      if (sessJson.success && sessJson.data) {
        setSessions(sessJson.data);
        if (sessJson.data.length > 0) {
          setSelectedSessionId(sessJson.data[0]._id);
        }
      }

      if (meJson.success && meJson.data) {
        setParticipant({ name: meJson.data.name || "", nim: meJson.data.nim || "" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCamera = async () => {
    if (!canCheckIn) {
      if (alreadyAttended) toast.error("Anda sudah melakukan presensi.");
      else if (periodStatus === "belum") toast.error("Presensi belum dibuka.");
      else toast.error("Presensi telah ditutup.");
      return;
    }
    setCaptureError(null);
    setPhotoUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setCameraOpen(true);
      // video element sudah render via effect
    } catch {
      setCaptureError("Tidak dapat mengakses kamera. Izinkan akses kamera di browser.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  useEffect(() => {
    if (cameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);

  useEffect(() => () => stopCamera(), []);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setPhotoUrl(canvas.toDataURL("image/jpeg", 0.8));
  };

  const retake = () => {
    setPhotoUrl(null);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
      toast.error("Pilih sesi terlebih dahulu");
      return;
    }
    if (!photoUrl) {
      toast.error("Ambil selfie terlebih dahulu");
      return;
    }

    setSubmitting(true);
    try {
      // Upload selfie ke storage
      const blob = await (await fetch(photoUrl)).blob();
      const uploadForm = new FormData();
      uploadForm.append("file", blob, "selfie.jpg");
      const uploadRes = await fetch(`${API_URL}/api/v1/contents/upload`, {
        method: "POST",
        body: uploadForm,
        credentials: "include",
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.fileUrl) {
        throw new Error(uploadJson.message || "Gagal mengunggah selfie");
      }
      const fileUrl = uploadJson.fileUrl;

      const body = JSON.stringify({
        sessionId: selectedSessionId,
        method: "SELF_CHECKIN",
        photoUrl: fileUrl,
      });

      // Retry 3x utk gagal jaringan/5xx, backoff 1s/2s/3s
      const maxAttempts = 3;
      let lastErr: Error | null = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await fetch(`${API_URL}/api/v1/pkkmb/attendance/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body,
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.message || "Gagal melakukan presensi");
          }
          toast.success("Berhasil presensi!");
          stopCamera();
          setPhotoUrl(null);
          fetchData();
          return;
        } catch (error: unknown) {
          // 4xx = kesalahan validasi/otorisasi, jangan retry
          if (error instanceof Error && /^(Pilih|Sesi|Lokasi|QR|Anda berada|Data peserta|Selfie|Presensi|Anda sudah)/.test(error.message)) {
            throw error;
          }
          lastErr = error as Error;
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, attempt * 1000));
          }
        }
      }
      throw lastErr || new Error("Gagal melakukan presensi");
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitIzin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
      toast.error("Pilih sesi terlebih dahulu");
      return;
    }
    if (!izinReason.trim()) {
      toast.error("Isi alasan izin/sakit");
      return;
    }
    setIzinSubmitting(true);
    try {
      let proofUrl: string | undefined;
      if (izinProof) {
        const form = new FormData();
        form.append("file", izinProof);
        const res = await fetch(`${API_URL}/api/v1/contents/upload`, {
          method: "POST",
          body: form,
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok || !json.fileUrl) throw new Error(json.message || "Gagal mengunggah bukti");
        proofUrl = json.fileUrl;
      }
      const res = await fetch(`${API_URL}/api/v1/pkkmb/attendance/izin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId: selectedSessionId, izinType, reason: izinReason, proofUrl }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal mengajukan izin");
      toast.success("Izin/sakit diajukan. Menunggu verifikasi panitia.");
      setIzinOpen(false);
      setIzinReason("");
      setIzinProof(null);
      fetchData();
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setIzinSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  const recap = history.reduce(
    (acc, r) => {
      const s = (r.status || "").toUpperCase();
      if (s === "HADIR") acc.hadir++;
      else if (s === "TELAT" || s === "TERLAMBAT") acc.late++;
      else if (s === "IZIN" || s === "SAKIT") acc.izin++;
      else if (s === "ALPHA" || s === "TIDAK_HADIR") acc.alpha++;
      else acc.other++;
      return acc;
    },
    { hadir: 0, late: 0, izin: 0, alpha: 0, other: 0 }
  );
  const totalRecords = history.length;
  const hadirPct = totalRecords ? Math.round((recap.hadir / totalRecords) * 100) : 0;

  const selectedSession = sessions.find((s) => s._id === selectedSessionId) || null;
  const periodStatus = selectedSession
    ? getPeriodStatus(now, selectedSession.startTime, selectedSession.endTime)
    : "tutup";
  const alreadyAttended = selectedSession
    ? history.some((r) => r.session._id === selectedSession._id && (r.status || "").toUpperCase() === "HADIR")
    : false;
  const canCheckIn = !!selectedSession && periodStatus === "aktif" && !alreadyAttended;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl font-display font-bold mb-1">Presensi Kehadiran</h1>
          <p className="text-white/60">Lakukan presensi mandiri dan pantau rekapitulasi kehadiran Anda.</p>
        </div>
        {totalRecords > 0 && (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>Total sesi dihadiri</span>
            <span className="px-3 py-1 bg-gold-500/10 border border-gold-500/20 text-gold-400 rounded-full font-bold">{totalRecords}</span>
          </div>
        )}
      </div>

      {/* Form Check-In Mandiri */}
      <div className="bg-gradient-to-br from-gold-500/[0.06] to-transparent border border-white/10 rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gold-500/15 rounded-2xl text-gold-400 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display">Check-In Mandiri</h2>
            <p className="text-sm text-white/50">Pilih sesi, lalu ambil selfie untuk hadir.</p>
          </div>
        </div>

        {selectedSession && !alreadyAttended && periodStatus !== "aktif" && (
          <div className={`mb-6 flex items-start gap-3 p-4 rounded-2xl border ${periodStatus === "belum" ? "bg-gold-500/5 border-gold-500/20" : "bg-red-500/5 border-red-500/20"}`}>
            <div className={`p-2 rounded-xl ${periodStatus === "belum" ? "bg-gold-500/15 text-gold-400" : "bg-red-500/15 text-red-400"}`}>
              <Lock className="w-5 h-5" />
            </div>
            <div className="text-sm">
              <p className={`font-bold ${periodStatus === "belum" ? "text-gold-400" : "text-red-400"}`}>
                {periodStatus === "belum" ? "Presensi Belum Dibuka" : "Presensi Ditutup"}
              </p>
              <p className="text-white/60 mt-1">
                {periodStatus === "belum" ? "Presensi dibuka pada:" : "Presensi telah ditutup pada:"}
              </p>
              <p className="text-white/80 font-medium mt-0.5">{formatWIBLong(selectedSession.startTime)}</p>
            </div>
          </div>
        )}

        {selectedSession && alreadyAttended && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl border border-green-500/20 bg-green-500/5">
            <div className="p-2 rounded-xl bg-green-500/15 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-sm">
              <p className="font-bold text-green-400">Sudah Presensi</p>
              {(() => {
                const r = history.find((h) => h.session._id === selectedSession._id && (h.status || "").toUpperCase() === "HADIR");
                return r ? <p className="text-white/60 mt-1">{formatWIBLong(r.checkInTime)}</p> : null;
              })()}
            </div>
          </div>
        )}
        
        {sessions.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl text-white/60">
            <AlertCircle className="w-5 h-5 text-gold-400" />
            <p className="text-sm">Saat ini tidak ada sesi presensi yang sedang berlangsung.</p>
          </div>
        ) : (
          <form className="space-y-4">
            <label className="text-sm font-semibold text-white/70">Pilih Sesi Acara</label>
            <div className="space-y-3">
              {sessions.map(s => {
                const isSelected = selectedSessionId === s._id;
                return (
                  <label
                    key={s._id}
                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gold-500/10 border-gold-500/40 text-white shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'border-gold-500' : 'border-white/30'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-white/80'}`}>{s.title}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-white/40">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatWIB(s.startTime, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                        {s.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {s.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <input type="radio" name="session" value={s._id} checked={isSelected} onChange={() => setSelectedSessionId(s._id)} className="sr-only" />
                  </label>
                );
              })}
            </div>

            <button
              type="button"
              onClick={openCamera}
              disabled={!canCheckIn}
              aria-label="Buka kamera dan ambil presensi"
              className="w-full px-8 py-4 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gold-500 flex items-center justify-center gap-2 text-base shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] active:scale-[0.99]"
            >
              <Camera className="w-5 h-5" />
              {alreadyAttended ? "Sudah Presensi" : periodStatus === "aktif" ? "Ambil Presensi" : "Buka Kamera & Hadir"}
            </button>
            <button
              type="button"
              onClick={() => setIzinOpen(true)}
              disabled={!canCheckIn}
              className="w-full px-8 py-3 bg-white/5 hover:bg-white/10 text-white/70 font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm border border-white/10"
            >
              <AlertCircle className="w-4 h-4" />
              Tidak Hadir (Izin / Sakit)
            </button>
          </form>
        )}
      </div>

      {/* Modal Izin / Sakit */}
      {izinOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="font-display font-bold text-lg">Ajukan Izin / Sakit</h3>
              <button onClick={() => setIzinOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/60"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitIzin} className="p-6 space-y-4">
              <div className="flex gap-3">
                {(["Izin", "Sakit"] as const).map((t) => (
                  <label key={t} className={`flex-1 relative flex items-center justify-center gap-2 border rounded-xl py-3 cursor-pointer transition-all ${izinType === t ? "bg-gold-500/10 border-gold-500 text-gold-400 font-bold" : "bg-white/5 border-white/10 text-white/60"}`}>
                    <input type="radio" name="izinType" value={t} checked={izinType === t} onChange={() => setIzinType(t)} className="hidden" />
                    {t === "Izin" ? "Izin" : "Sakit"}
                  </label>
                ))}
              </div>
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Alasan</label>
                <textarea value={izinReason} onChange={(e) => setIzinReason(e.target.value)} rows={3} className="w-full px-4 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500" placeholder="Tuliskan alasan izin/sakit" />
              </div>
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Bukti (surat izin/sakit, opsional)</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setIzinProof(e.target.files?.[0] || null)} className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/10 file:text-white file:font-bold file:cursor-pointer" />
              </div>
              <button type="submit" disabled={izinSubmitting} className="w-full px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                {izinSubmitting ? (
                  <><div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Mengirim...</>
                ) : (
                  <>Ajukan {izinType === "Izin" ? "Izin" : "Sakit"}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kamera */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="font-display font-bold text-lg">Selfie Presensi</h3>
              <button onClick={() => { stopCamera(); setPhotoUrl(null); }} className="p-2 rounded-lg hover:bg-white/10 text-white/60"><X className="w-5 h-5" /></button>
            </div>

            {/* Metadata sesi */}
            {(() => {
              const s = sessions.find((x) => x._id === selectedSessionId);
              return s ? (
                <div className="px-6 py-4 bg-white/[0.03] border-b border-white/10 space-y-2">
                  <p className="font-bold text-white">{s.title}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gold-400/70" />
                      {formatWIB(s.date, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} WIB
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gold-400/70" />
                      {s.location || "Lokasi belum ditentukan"}
                    </span>
                  </div>
                  {participant.name && (
                    <div className="flex items-center gap-1.5 text-xs text-white/60 pt-1">
                      <User className="w-3.5 h-3.5 text-gold-400/70" />
                      {participant.name}{participant.nim ? ` (${participant.nim})` : ""}
                    </div>
                  )}
                </div>
              ) : null;
            })()}

            <div className="p-6">
              {captureError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {captureError}
                </div>
              )}

              {!photoUrl ? (
                <>
                  <div className="aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/10 relative">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
                    {!cameraOpen && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/40">
                        <Camera className="w-10 h-10" />
                        <p className="text-sm">Menyiapkan kamera...</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={capture}
                    className="mt-4 w-full px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" /> Ambil Foto
                  </button>
                </>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="Selfie" className="aspect-[4/3] w-full object-cover rounded-2xl border border-white/10" />
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={retake}
                      className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white/70 font-bold rounded-xl border border-white/10"
                    >
                      Ambil Ulang
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckIn}
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? (
                        <><div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Memproses...</>
                      ) : (
                        <><CheckCircle2 className="w-5 h-5" /> Konfirmasi Hadir</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rekap Kehadiran */}
      {totalRecords > 0 && (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-bold">Rekapitulasi Kehadiran</h3>
            <span className={`text-lg font-display font-black ${hadirPct >= 75 ? 'text-green-400' : hadirPct >= 50 ? 'text-gold-400' : 'text-red-400'}`}>
              {hadirPct}%
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Hadir", value: recap.hadir, color: "text-green-400", bar: "bg-green-500", pct: totalRecords ? Math.round((recap.hadir / totalRecords) * 100) : 0 },
              { label: "Terlambat", value: recap.late, color: "text-yellow-400", bar: "bg-yellow-500", pct: totalRecords ? Math.round((recap.late / totalRecords) * 100) : 0 },
              { label: "Izin / Sakit", value: recap.izin, color: "text-blue-400", bar: "bg-blue-500", pct: totalRecords ? Math.round((recap.izin / totalRecords) * 100) : 0 },
              { label: "Tidak Hadir", value: recap.alpha, color: "text-red-400", bar: "bg-red-500", pct: totalRecords ? Math.round((recap.alpha / totalRecords) * 100) : 0 },
            ].map((item) => (
              <div key={item.label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">{item.label}</p>
                <p className={`font-display text-3xl font-black ${item.color}`}>{item.value}</p>
                <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className={`${item.bar} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Riwayat Presensi */}
      <div>
        <h3 className="text-xl font-display font-bold mb-6">Riwayat Presensi</h3>
        
        {history.length === 0 ? (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl">
            <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white/50">Belum Ada Presensi</h3>
            <p className="text-white/40 text-sm mt-2">Anda belum melakukan presensi pada sesi mana pun.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((record) => {
              const isPresent = (record.status || "").toUpperCase() === "HADIR";
              return (
                <div key={record._id} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col hover:border-white/20 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5
                      ${isPresent ? 'bg-green-500/10 border-green-500/20 text-green-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}
                    `}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="capitalize">{record.status.toLowerCase()}</span>
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {formatWIB(record.checkInTime, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg leading-tight mb-4">{record.session.title}</h3>

                  {record.izinStatus && record.izinStatus !== "NONE" && (
                    <div className="mb-4 space-y-2">
                      <span className={`inline-block px-3 py-1 text-xs font-bold rounded-lg border ${
                        record.izinStatus === "APPROVED" ? 'bg-green-500/10 border-green-500/20 text-green-300'
                        : record.izinStatus === "REJECTED" ? 'bg-red-500/10 border-red-500/20 text-red-300'
                        : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
                      }`}>
                        {record.izinStatus === "PENDING" ? "Menunggu Verifikasi" : record.izinStatus === "APPROVED" ? "Disetujui" : "Ditolak"}
                      </span>
                      {record.reason && <p className="text-xs text-white/50 italic">{record.reason}</p>}
                    </div>
                  )}
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Clock className="w-4 h-4 text-gold-400/70 shrink-0" />
                      <span>
                        {formatWIB(record.session.startTime, { dateStyle: "medium", timeStyle: "short" })} WIB
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <MapPin className="w-4 h-4 text-gold-400/70 shrink-0" />
                      <span className="truncate">{record.session.location || "Lokasi Belum Ditentukan"}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-white/40">Metode</span>
                    <span className="text-white/70 font-medium capitalize">
                      {record.attendanceMethod === "SELF_CHECKIN" ? "Self Check-in" : "Manual"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
