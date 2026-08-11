"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL, apiFetch } from "@/lib/api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  LogOut,
  ScanLine,
  Loader2,
  UploadCloud,
  AlertCircle,
} from "lucide-react";

import PhotoCropDialog from "@/components/onboarding/PhotoCropDialog";
import HealthStep, { type HealthStepHandle } from "@/components/onboarding/HealthStep";
import ConsentStep from "@/components/onboarding/ConsentStep";

// Decode QR dari file gambar (jpg/png) via jsQR.
async function decodeQrFromImage(file: File): Promise<string | null> {
  const jsQR = (await import("jsqr")).default;
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

interface OcrData {
  name: string;
  nim: string;
  faculty: string;
  studyProgram: string;
  address: string;
}

const departments = [
  "S1 Pendidikan Teknik Mesin",
  "S1 Pendidikan Vokasional Teknologi Otomotif",
  "S1 Teknik Mesin",
  "S1 Teknik Metalurgi",
  "S1 Teknik Pertambangan",
  "S1 Pendidikan Teknik Elektro",
  "S1 Teknik Elektro",
  "S1 Pendidikan Teknologi Informasi",
  "S1 Teknik Informatika",
  "S1 Sistem Informasi",
  "S1 Pendidikan Teknik Bangunan",
  "S1 Teknik Sipil",
  "S1 Perencanaan Wilayah dan Kota",
  "S1 Pendidikan Tata Boga",
  "S1 Pendidikan Tata Busana",
  "S1 Pendidikan Tata Rias",
  "S1 Pariwisata",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [searchDept, setSearchDept] = useState("");

  // KTMS
  const [ktmFile, setKtmFile] = useState<File | null>(null);
  const [ktmPreviewUrl, setKtmPreviewUrl] = useState<string | null>(null);
  const [ktmStored, setKtmStored] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [qrResult, setQrResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [qrScanning, setQrScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const healthRef = useRef<HealthStepHandle>(null);
  const [hydrated, setHydrated] = useState(false);

  // Pasfoto
  const [croppedAvatarBlob, setCroppedAvatarBlob] = useState<Blob | null>(null);
  const [croppedAvatarUrl, setCroppedAvatarUrl] = useState<string | null>(null);

  // Data (dari OCR + manual)
  const [formData, setFormData] = useState({
    name: "",
    nim: "",
    faculty: "",
    studyProgram: "",
    address: "",
    gender: "",
    phone: "",
  });

  const [onboardedGroup, setOnboardedGroup] = useState<{ nomor: number; name: string } | null>(null);

  // Pastikan user sudah login & belum onboarding.
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiFetch("/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            if (data.data.isOnboarded) {
              router.push("/dashboard");
              return;
            }
            const p = data.data;
            if (p.studyProgram) setSearchDept(p.studyProgram);
          } else {
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    };
    fetchProfile();
  }, [router]);

  // Restore progres onboarding dari localStorage (auto-save saat refresh).
  useEffect(() => {
    try {
      const raw = localStorage.getItem("onboardingProgress");
      if (raw) {
        const saved = JSON.parse(raw) as {
          step?: number;
          formData?: Partial<typeof formData>;
          ocrStatus?: typeof ocrStatus;
          ktmPreviewUrl?: string;
          ktmFileName?: string;
          ktmFileType?: string;
          qrResult?: { ok: boolean; text: string } | null;
          ktmStored?: string;
        };
        // Step 5/6 (persetujuan/selesai) bersifat transient — buang progres,
        // user harus mulai dari awal (mis. setelah reset akun).
        if (saved.step && saved.step < 5) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- restore progres dari localStorage sekali saat mount (pola hydration)
          setStep(saved.step);
          if (saved.formData) {
            setFormData((f) => ({ ...f, ...saved.formData }));
            if (saved.formData.studyProgram) setSearchDept(saved.formData.studyProgram);
          }
          if (saved.ocrStatus) setOcrStatus(saved.ocrStatus);
          if (saved.ktmStored) {
            setKtmStored(saved.ktmStored);
            setKtmPreviewUrl(saved.ktmStored);
            setOcrStatus("done");
            const mime =
              saved.ktmStored.split(";")[0]?.replace("data:", "") ||
              saved.ktmFileType ||
              "image/jpeg";
            const name = saved.ktmFileName || "ktm";
            const ext = mime === "application/pdf" ? ".pdf" : ".jpg";
            try {
              const data = saved.ktmStored.split(",")[1] || "";
              const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
              setKtmFile(new File([bytes], name.endsWith(".pdf") || name.endsWith(".jpg") ? name : name + ext, { type: mime }));
            } catch {
              setKtmFile(null);
            }
          } else if (saved.ktmPreviewUrl) {
            setKtmPreviewUrl(saved.ktmPreviewUrl);
          }
          if (saved.qrResult) {
            setQrResult(saved.qrResult);
            // ponytail: QR berisi NIM; gabung ke formData (jangan menimpa field
            // lain) agar step 1 bisa lanjut setelah refresh.
            if (saved.qrResult.ok) {
              setFormData((f) => ({ ...f, nim: saved.qrResult!.text || f.nim }));
            }
          }
        }
        // Sesi selesai → buang progres + pasfoto, mulai dari awal.
        if (saved.step && saved.step >= 5) {
          try { localStorage.removeItem("onboardingProgress"); } catch {}
          try { localStorage.removeItem("onboardingAvatarBase64"); } catch {}
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Simpan progres ke localStorage setiap kali berubah.
  useEffect(() => {
    // jangan nimpa data tersimpan sebelum restore (hydration) selesai
    if (!hydrated) return;
    try {
      localStorage.setItem(
        "onboardingProgress",
        JSON.stringify({
          step,
          formData,
          ocrStatus,
          ktmStored,
          ktmFileName: ktmFile?.name,
          ktmFileType: ktmFile?.type,
          qrResult,
        }),
      );
    } catch {}
  }, [step, formData, ocrStatus, ktmStored, ktmFile, qrResult, hydrated]);

  // Restore pasfoto dari localStorage.
  useEffect(() => {
    const savedAvatar = localStorage.getItem("onboardingAvatarBase64");
    if (savedAvatar) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore pasfoto dari localStorage sekali saat mount (pola hydration)
      setCroppedAvatarUrl(savedAvatar);
      const mime = savedAvatar.split(";")[0]?.replace("data:", "") || "image/jpeg";
      try {
        const data = savedAvatar.split(",")[1] || "";
        const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
        setCroppedAvatarBlob(new Blob([bytes], { type: mime }));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });

  // Kompres gambar (KTMS/pasfoto) via canvas jadi JPEG agar hemat localStorage.
  const compressImage = (file: File, maxSize = 1600, quality = 0.7) =>
    new Promise<string>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });

  useEffect(() => {
    if (croppedAvatarBlob) {
      compressImage(new File([croppedAvatarBlob], "avatar.jpg", { type: croppedAvatarBlob.type || "image/jpeg" }), 800, 0.75)
        .then((b64) => {
          try {
            localStorage.setItem("onboardingAvatarBase64", b64);
          } catch {}
        })
        .catch(console.error);
    } else {
      localStorage.removeItem("onboardingAvatarBase64");
    }
  }, [croppedAvatarBlob]);

  const handleImageCropped = (blob: Blob, url: string) => {
    setCroppedAvatarBlob(blob);
    setCroppedAvatarUrl(url);
  };

  // ── STEP 1: Upload KTMS + OCR ─────────────────────────────
  const handleKtmSelected = async (file: File) => {
    setKtmFile(file);
    setKtmPreviewUrl(URL.createObjectURL(file));
    setOcrStatus("loading");
    setError(null);
    setQrResult(null);

    // Simpan file KTMS (terkompresi utk gambar) ke localStorage agar bisa
    // di-download ulang setelah refresh. PDF disimpan apa adanya (blob: tidak
    // persist, jadi konversi base64).
    try {
      const stored =
        file.type.startsWith("image/") && !file.type.includes("svg")
          ? await compressImage(file)
          : await toBase64(file);
      setKtmStored(stored);
    } catch {
      setKtmStored(null);
    }

    // Coba decode QR untuk NIM (opsional, tambahan).
    if (file.type.startsWith("image/")) {
      setQrScanning(true);
      try {
        const text = await decodeQrFromImage(file);
        const nimMatch = text?.match(/\b\d{8,12}\b/);
        if (nimMatch) {
          setFormData((f) => ({ ...f, nim: nimMatch[0] }));
          setQrResult({ ok: true, text: nimMatch[0] });
        } else {
          setQrResult({ ok: false, text: text || "Tidak ada kode QR yang terbaca pada foto" });
        }
      } catch {
        setQrResult({ ok: false, text: "Gagal membaca kode QR pada foto" });
      } finally {
        setQrScanning(false);
      }
    }

    // OCR via backend.
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/pkkmb/ktms/ocr", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const d: OcrData = json.data;
        setFormData((f) => ({
          ...f,
          name: d.name || f.name,
          nim: d.nim || f.nim,
          faculty: d.faculty || f.faculty,
          studyProgram: d.studyProgram || f.studyProgram,
          address: d.address || f.address,
        }));
        if (d.studyProgram) setSearchDept(d.studyProgram);
        setOcrStatus("done");
      } else {
        setOcrStatus("error");
        setError(json.message || "Data belum berhasil terbaca. Coba unggah foto yang lebih jelas dan terang.");
      }
    } catch {
      setOcrStatus("error");
      setError("Gagal terhubung ke server. Silakan coba lagi.");
    }
  };

  const goToStep2 = () => {
    if (ocrStatus !== "done") {
      setError("Tunggu sampai data selesai terbaca, atau unggah ulang fotonya.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (!formData.nim) {
      setError("NIM belum terbaca. Coba unggah ulang dengan foto yang lebih jelas dan tidak buram.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    setError(null);
    setStep(2);
  };

  // ── STEP 2: Konfirmasi data OCR + Data tambahan → STEP 3 (Kesehatan) ──
  const goToStep3 = () => {
    if (!formData.name || !formData.nim || !formData.studyProgram) {
      setError("Nama, NIM, dan Program Studi wajib diisi.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (!formData.gender || !formData.phone) {
      setError("Lengkapi jenis kelamin dan No. WhatsApp aktif.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    setError(null);
    setStep(3);
  };

  // ── STEP 4: Pasfoto ──────────────────────────────────────
  const handleSaveAndContinue = async () => {
    if (!croppedAvatarBlob && !croppedAvatarUrl) {
      setError("Unggah pasfoto 3x4 terlebih dahulu.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    setIsLoading(true);
    try {
      let finalAvatarKey = croppedAvatarUrl || "";
      if (croppedAvatarBlob) {
        const uploadForm = new FormData();
        uploadForm.append("file", croppedAvatarBlob, "avatar.webp");
        const uploadRes = await apiFetch("/contents/upload", {
          method: "POST",
          body: uploadForm,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalAvatarKey = uploadData.fileUrl;
        } else {
          setError("Gagal mengunggah pasfoto.");
          setIsLoading(false);
          return;
        }
      }

      let finalKtmKey = ktmPreviewUrl || "";
      if (ktmFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", ktmFile, ktmFile.name);
        const uploadRes = await apiFetch("/contents/upload", {
          method: "POST",
          body: uploadForm,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalKtmKey = uploadData.fileUrl;
        } else {
          setError("Gagal mengunggah KTM.");
          setIsLoading(false);
          return;
        }
      }

      const payload = {
        nim: formData.nim,
        name: formData.name,
        department: formData.studyProgram,
        gender: formData.gender,
        phone: formData.phone,
        avatarObjectKey: finalAvatarKey,
        ktmObjectKey: finalKtmKey,
      };

      const res = await apiFetch("/pkkmb/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await res.json();
        setStep(5);
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Terjadi kesalahan saat menyimpan data.");
        setIsLoading(false);
      }
    } catch {
      setError("Gagal terhubung ke server.");
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {}
    router.push("/login");
  };

  const stepLabels = [
    { n: 1, t: "Upload KTMS", d: "Data terbaca otomatis" },
    { n: 2, t: "Konfirmasi Data", d: "Periksa & perbaiki data" },
    { n: 3, t: "Data Kesehatan", d: "Riwayat & risiko" },
    { n: 4, t: "Pasfoto Resmi", d: "Unggah pasfoto 3x4" },
    { n: 5, t: "Persetujuan", d: "Tanda tangan digital" },
    { n: 6, t: "Penetapan Adrista", d: "Sistem membagi gugus" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-body relative overflow-x-hidden p-4 sm:p-8 py-12">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <Image src="/images/gedung_ft_new.webp" alt="Background" fill priority className="object-cover opacity-[0.03] mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gold-500/20 blur-[150px] rounded-full mix-blend-screen"
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl my-auto mx-auto flex flex-col lg:flex-row bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Left Pane */}
        <div className="w-full lg:w-[40%] p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 bg-gradient-to-br from-white/[0.05] to-transparent relative flex flex-col overflow-y-auto custom-scrollbar" data-lenis-prevent>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-500 to-transparent" />
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 relative mb-6">
              <Image src="/logo_adrata.webp" alt="Logo Adrata" fill sizes="80px" priority className="object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">
              Selamat Datang di <br />
              <span className="text-gold-500">Keluarga Teknik!</span>
            </h1>
            <p className="text-white/50 text-sm leading-relaxed mb-12">
              Data diri Anda akan terbaca otomatis dari foto KTM Sementara. Pastikan foto terlihat jelas dan tidak buram, ya!
            </p>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px before:h-full before:w-[2px] before:bg-white/10">
            <AnimatePresence mode="popLayout" initial={false}>
            {stepLabels.filter((s) => {
              const lower = Math.max(1, Math.min(step - 2, 3));
              return s.n >= lower && s.n <= lower + 4;
            }).map((s) => (
              <motion.div
                key={s.n}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.25 }}
                className={`relative flex items-start gap-5 ${step >= s.n ? "opacity-100" : "opacity-40 grayscale"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 z-10 transition-colors duration-500 ${step > s.n ? "bg-gold-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" : step === s.n ? "bg-black border-2 border-gold-500 text-gold-500 shadow-[0_0_18px_rgba(234,179,8,0.35)]" : "bg-black border-2 border-white/20 text-white/40"}`}>
                  {step > s.n ? <CheckCircle2 className="w-5 h-5" /> : s.n}
                </div>
                <div className="pt-1">
                  <h3 className={`font-bold transition-colors ${step >= s.n ? "text-white" : "text-white/40"}`}>{s.t}</h3>
                  <p className="text-xs text-white/40 mt-1">{s.d}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          </div>

          <div className="mt-6 flex justify-center lg:justify-start mt-auto">
            <button onClick={handleLogout} className="text-white/40 hover:text-red-400 text-xs font-semibold flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
              <LogOut className="w-4 h-4" /> Keluar dari Akun
            </button>
          </div>
        </div>

        {/* Right Pane */}
        <div className="w-full lg:w-[60%] p-8 lg:p-12 relative flex flex-col h-[88vh]">
          <div className="flex lg:hidden justify-between items-center mb-6">
            <div className="flex-1 mr-6">
              <div className="text-sm font-bold text-gold-500 mb-2">Langkah {step} dari 6</div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gold-500 to-amber-500 rounded-full transition-all duration-500" style={{ width: `${(step / 6) * 100}%` }} />
              </div>
            </div>
            <button onClick={handleLogout} className="text-white/40 hover:text-red-400 text-xs font-semibold flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar" data-lenis-prevent>
          <AnimatePresence mode="wait">
            {/* STEP 1: Upload KTMS */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-6 flex flex-col flex-1 min-h-full">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Verifikasi Identitas Mahasiswa</h2>
                  <p className="text-white/50 text-sm mb-6">
                    Unggah foto KTM Sementara (KTMS) Anda. Data diri di kartu akan terbaca otomatis —
                    tidak perlu diketik manual. Pastikan foto jelas dan tidak terpotong.
                  </p>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await handleKtmSelected(file);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                />

                {!ktmPreviewUrl ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-white/[0.02] hover:bg-white/[0.04] hover:border-gold-500/40 transition-colors group"
                  >
                    <UploadCloud className="w-14 h-14 text-white/30 mb-4 group-hover:text-gold-500 transition-colors" />
                    <p className="font-bold mb-1">Klik untuk memilih foto</p>
                    <p className="text-xs text-white/40">JPG, PNG, atau PDF (maks. 5MB)</p>
                    <p className="text-xs text-white/30 mt-4 max-w-xs">💡 Pastikan seluruh bagian kartu terlihat jelas agar nama, NIM, dan program studi terbaca semua.</p>
                  </button>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-col items-center justify-center p-10 bg-white/[0.02] border border-white/10 rounded-3xl relative overflow-hidden">
                      <div className="w-full max-w-[300px] h-[200px] rounded-2xl overflow-hidden border-2 border-gold-500/50 flex items-center justify-center bg-black">
                        {ktmFile?.type === "application/pdf" || ktmPreviewUrl.endsWith(".pdf") ? (
                          <div className="text-center p-4">
                            <svg className="w-16 h-16 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            <p className="font-bold text-sm break-all">{ktmFile?.name || "KTMS.pdf"}</p>
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ktmPreviewUrl} alt="KTMS preview" className="w-full h-full object-contain" />
                        )}
                      </div>
                    </div>

                    {ocrStatus === "loading" && (
                      <div className="flex items-center justify-center gap-3 text-gold-400 text-sm py-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{qrScanning ? "Membaca kode & data dari kartu..." : "Sedang membaca data dari foto Anda..."}</span>
                      </div>
                    )}

                    {ocrStatus === "done" && (
                      <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Data berhasil dibaca! Silakan periksa kembali di langkah berikutnya.</span>
                      </div>
                    )}

                  
                    {!qrScanning && qrResult && (
                      <p className={`text-sm flex items-center gap-2 ${qrResult.ok ? "text-green-400" : "text-yellow-400"}`}>
                        <ScanLine className="w-4 h-4" />
                        {qrResult.ok ? `NIM terbaca dari QR di kartu: ${qrResult.text}` : `QR: ${qrResult.text}`}
                      </p>
                    )}

                    <div className="flex justify-center">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2 rounded-full text-sm font-bold text-white/40 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                      >
                        Ganti File
                      </button>
                    </div>
                  </div>
                )}

                                </div>
              </motion.div>
            )}

            {/* STEP 2: Konfirmasi Data OCR */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-6 flex flex-col flex-1 min-h-full">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Konfirmasi Data Identitas</h2>
                  <p className="text-white/50 text-sm mb-2">Data di bawah terbaca otomatis dari foto KTM Sementara Anda. Periksa dan perbaiki bila ada yang salah.</p>
                  {qrResult?.ok && (
                    <p className="text-xs text-green-400 flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4" /> Kode QR di kartu terbaca — NIM {qrResult.text}
                    </p>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-start space-y-6">

                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Nama Lengkap</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500 focus:bg-white/10 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">NIM</label>
                    <input type="text" value={formData.nim} onChange={(e) => setFormData({ ...formData, nim: e.target.value.replace(/\D/g, "") })} className="w-full px-5 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500 focus:bg-white/10 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Fakultas</label>
                    <input type="text" value={formData.faculty || "Fakultas Teknik"} onChange={(e) => setFormData({ ...formData, faculty: e.target.value })} className="w-full px-5 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500 focus:bg-white/10 transition-all" />
                  </div>
                  <div className="relative">
                    {isDeptDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDeptDropdownOpen(false)} />}
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Program Studi</label>
                    <input
                      type="text"
                      value={searchDept}
                      onChange={(e) => {
                        setSearchDept(e.target.value);
                        setIsDeptDropdownOpen(true);
                        if (formData.studyProgram && e.target.value !== formData.studyProgram) setFormData({ ...formData, studyProgram: "" });
                      }}
                      onFocus={() => setIsDeptDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsDeptDropdownOpen(false), 200)}
                      className="relative w-full px-5 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500 focus:bg-white/10 transition-all z-50 cursor-text"
                    />
                    <AnimatePresence>
                      {isDeptDropdownOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                          <div className="max-h-60 overflow-y-auto custom-scrollbar" data-lenis-prevent>
                            {departments.filter((d) => d.toLowerCase().includes(searchDept.toLowerCase())).map((dept, idx) => (
                              <div key={idx} onClick={() => { setFormData({ ...formData, studyProgram: dept }); setSearchDept(dept); setIsDeptDropdownOpen(false); }} className={`px-5 py-3 cursor-pointer transition-colors flex items-center justify-between ${formData.studyProgram === dept ? "bg-gold-500/10 text-gold-500 font-bold" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
                                {dept}
                                {formData.studyProgram === dept && <CheckCircle2 className="w-4 h-4 text-gold-500" />}
                              </div>
                            ))}
                            {departments.filter((d) => d.toLowerCase().includes(searchDept.toLowerCase())).length === 0 && (
                              <div className="px-5 py-3 text-white/50 text-sm">Program studi tidak ditemukan</div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Alamat</label>
                    <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-5 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500 focus:bg-white/10 transition-all" />
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider block">Jenis Kelamin</label>
                    <div className="flex gap-4">
                      {(["L", "P"] as const).map((g) => (
                        <label key={g} className={`flex-1 relative flex items-center justify-center gap-3 border rounded-xl py-4 cursor-pointer transition-all duration-300 ${formData.gender === g ? "bg-gold-500/10 border-gold-500 text-gold-400 font-bold" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"}`}>
                          <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="hidden" />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.gender === g ? "border-gold-500" : "border-white/20"}`}>
                            {formData.gender === g && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                          </div>
                          {g === "L" ? "Laki-laki" : "Perempuan"}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">No. WhatsApp Aktif</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-5 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500 focus:bg-white/10 transition-all" placeholder="08xxxxxxxxxx" />
                  </div>
                </div>

                </div>
              </motion.div>
            )}

            {/* STEP 3: Data Kesehatan */}
            {step === 3 && (
              <HealthStep
                ref={healthRef}
                apiUrl={API_URL}
                onBack={() => setStep(2)}
                onComplete={() => setStep(4)}
              />
            )}

            {/* STEP 4: Pasfoto */}
            {step === 4 && (
              <motion.div key="s5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-6 flex flex-col flex-1 min-h-full">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Unggah Pasfoto 3x4</h2>
                  <p className="text-white/50 text-sm mb-4">Pasfoto ini digunakan untuk ID Card Maba dan administrasi fakultas.</p>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-3">Ketentuan Pasfoto</p>
                    <ul className="text-white/60 text-sm space-y-2 ml-5 list-disc marker:text-gold-500">
                      <li>Latar belakang wajib <strong className="text-white">Merah</strong>.</li>
                      <li>Kemeja berwarna <strong className="text-white">Putih</strong>.</li>
                      <li>Bagi berhijab, wajib hijab berwarna <strong className="text-white">Hitam</strong>.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  {!croppedAvatarUrl ? (
                    <PhotoCropDialog onImageCropped={handleImageCropped} isLoading={isLoading} />
                  ) : (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
                      <div className="flex flex-col items-center justify-center p-10 bg-white/[0.02] border border-white/10 rounded-3xl">
                        <div className="w-[150px] h-[200px] rounded-2xl overflow-hidden border-2 border-gold-500/50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={croppedAvatarUrl?.startsWith("/") ? `${API_URL}${croppedAvatarUrl}` : croppedAvatarUrl || ""} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <p className="mt-6 text-green-400 font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" /> Foto Siap Disimpan
                        </p>
                      </div>
                      <div className="flex justify-center">
                        <button onClick={() => { setCroppedAvatarBlob(null); setCroppedAvatarUrl(null); }} className="px-6 py-2 rounded-full text-sm font-bold text-white/40 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/5">Pilih Foto Lain</button>
                      </div>
                    </motion.div>
                  )}
                </div>

              </motion.div>
            )}

            {/* STEP 5: Persetujuan */}
            {step === 5 && (
              <ConsentStep
                apiUrl={API_URL}
                onBack={() => setStep(4)}
                onDone={(group) => {
                  setOnboardedGroup(group);
                  setStep(6);
                  ["onboardingProgress", "onboardingHealth", "onboardingAvatarBase64"].forEach((k) => { try { localStorage.removeItem(k); } catch {} });
                }}
                summary={{
                  name: formData.name,
                  nim: formData.nim,
                  faculty: formData.faculty,
                  studyProgram: formData.studyProgram,
                  phone: formData.phone,
                  healthReady: true,
                  pasfotoReady: !!croppedAvatarUrl,
                }}
              />
            )}

            {/* STEP 6: Penetapan Gugus */}
            {step === 6 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, delay: 0.1 }} className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 mb-8 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                  <CheckCircle2 className="w-12 h-12" />
                </motion.div>
                <h2 className="text-3xl font-display font-bold text-white mb-4">Registrasi Selesai!</h2>
                <p className="text-white/50 text-sm max-w-sm mx-auto mb-10 leading-relaxed">
                  Selamat! Anda telah terdaftar sebagai peserta PKKMB FT UNESA. Data Anda telah disimpan dalam sistem.
                </p>

                <div className="p-6 rounded-2xl bg-gradient-to-b from-gold-500/10 to-transparent border border-gold-500/20 inline-block mb-10 max-w-sm w-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50" />
                  <p className="text-gold-500/80 text-xs font-bold uppercase tracking-wider mb-2">Gugus Adrista Kamu</p>
                  {onboardedGroup ? (
                    <>
                      <p className="text-2xl font-bold text-gold-400 mb-1 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">Gugus {String(onboardedGroup.nomor).padStart(2, "0")}</p>
                      <p className="text-gold-200/80 font-semibold mb-3">{onboardedGroup.name}</p>
                      <p className="text-xs text-gold-200/50 leading-relaxed">Selamat! Kamu sudah tergabung dalam gugus. Selengkapnya bisa dilihat di Dashboard.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gold-400 mb-1 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">Belum Ada Gugus</p>
                      <p className="text-xs text-gold-200/50 leading-relaxed">Gugus belum ditetapkan. Info gugus akan muncul di Dashboard begitu tersedia.</p>
                    </>
                  )}
                </div>

                <button onClick={() => router.push("/dashboard")} className="w-full max-w-sm flex items-center justify-center gap-2 bg-white text-black hover:bg-gold-500 px-8 py-4 rounded-xl font-bold transition-all duration-300">
                  Masuk ke Dashboard Maba
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          {/* Fixed Nav Footer */}
          <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
            <div>
              {step > 1 && step <= 6 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="group flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-white/40 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  Kembali
                </button>
              )}
            </div>
            <div>
              {step === 1 && (
                <button
                  onClick={goToStep2}
                  disabled={!ktmPreviewUrl || ocrStatus === "loading"}
                  className="group flex items-center gap-2 bg-gold-500 text-black px-8 py-3.5 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-400 active:scale-[0.98]"
                >
                  Lanjut ke Konfirmasi Data
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={goToStep3}
                  className="group flex items-center gap-2 bg-gold-500 text-black px-8 py-3.5 rounded-xl font-bold transition-all duration-300 hover:bg-gold-400 active:scale-[0.98]"
                >
                  Data Sesuai, Lanjut
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={() => healthRef.current?.submit()}
                  className="group flex items-center gap-2 bg-gold-500 text-black px-8 py-3.5 rounded-xl font-bold transition-all duration-300 hover:bg-gold-400 active:scale-[0.98]"
                >
                  Lanjut ke Pasfoto
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              )}
              {step === 4 && (
                <button
                  onClick={handleSaveAndContinue}
                  disabled={isLoading}
                  className="group flex items-center gap-2 bg-gold-500 text-black px-8 py-3.5 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-400 active:scale-[0.98]"
                >
                  {isLoading ? "Menyimpan..." : "Simpan & Lanjut"}
                  {!isLoading && <ArrowRight className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 bg-[#1a0a0a] border border-red-500/30 text-red-300 text-sm rounded-2xl shadow-2xl"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
