"use client";

import { useState } from "react";
import {
  MessageSquare,
  Shield,
  Send,
  Info,
  CheckCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { useSubmitAspirasi } from "@/hooks/useAspirasi";

export default function AspirasiClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "Fasilitas" as
      | "Fasilitas"
      | "Akademik"
      | "Organisasi"
      | "Lainnya",
    message: "",
    isAnonymous: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [copied, setCopied] = useState(false);

  const submitMutation = useSubmitAspirasi();

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(
      {
        ...formData,
        name: formData.isAnonymous ? "Anonim" : formData.name.trim(),
      },
      {
        onSuccess: (res) => {
          setTrackingId(res.data.id);
          setSubmitted(true);
        },
      },
    );
  };

  if (submitted) {
    return (
      <div className="pt-40 pb-24 px-6 max-w-xl mx-auto text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-[#10b981] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(16, 185, 129,0.5)]">
          <CheckCircle className="w-12 h-12 text-[#091c11]" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Aspirasi Terkirim!
        </h1>
        <p className="text-gray-300 mb-12">
          Terima kasih atas kontribusi Anda. Identitas Anda aman dalam protokol
          kami.
        </p>

        <div className="p-8 rounded-3xl border border-white/10 bg-white/5 mb-12 relative group">
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-4">
            Tracking ID Anda:
          </p>
          <div className="flex flex-col gap-4">
            <p className="text-3xl font-mono text-[#10b981] font-bold border-2 border-dashed border-[#10b981]/30 py-6 rounded-2xl bg-[#10b981]/5">
              {trackingId}
            </p>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 text-[10px] font-mono text-[#10b981] hover:text-white transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? "TERSALIN KE CLIPBOARD" : "SALIN TRACKING ID"}
            </button>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="btn-strategic mx-auto"
        >
          Kirim Aspirasi Lain
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left Side: Info */}
        <div className="lg:col-span-5 space-y-12">
          <div className="p-10 rounded-[40px] glass-overlay relative overflow-hidden border-white/5">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <MessageSquare className="w-24 h-24 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-6 leading-tight font-sans">
              Suara Mahasiswa Teknik
            </h2>
            <p className="text-gray-300 leading-relaxed mb-10 text-sm">
              BEM FT UNESA berkomitmen untuk menjadi jembatan aspirasi yang
              responsif. Ceritakan keluhan, saran, atau ide Anda demi perbaikan
              Fakultas Teknik yang lebih baik.
            </p>

            <div className="space-y-6">
              {[
                {
                  icon: Shield,
                  title: "Keamanan Identitas",
                  desc: "Sistem enkripsi menjamin nama pelapor dirahasiakan.",
                },
                {
                  icon: CheckCircle,
                  title: "Respon Terukur",
                  desc: "Setiap laporan masuk akan dievaluasi dalam 3x24 jam.",
                },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-2xl glass-subtle flex items-center justify-center shrink-0 border-[#10b981]/20">
                    <item.icon className="w-6 h-6 text-[#10b981]" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-400 leading-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 flex items-center gap-4 text-[10px] font-mono text-gray-400 glass-subtle rounded-2xl border-white/5">
            <Info className="w-4 h-4 text-[#10b981]" />
            <span>
              PROTOCOL:{" "}
              <span className="text-[#10b981]/60 italic">AEC_VOICE_v1.0</span>{" "}
              {"//"} AUTH:{" "}
              <span className="text-[#10b981]/60 italic">
                STUDENT_IDENTIFIED
              </span>
            </span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-7 glass-overlay rounded-[40px] p-8 md:p-16 relative overflow-hidden border-white/5">
          {/* Architectural Decor */}
          <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-[#10b981]/10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 border-b border-l border-[#10b981]/10" />

          <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label
                  htmlFor="name"
                  className="text-[10px] font-mono text-gray-400 uppercase tracking-widest pl-2"
                >
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  required={!formData.isAnonymous}
                  className="w-full bg-[#12331e]/10 border border-white/5 rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:border-[#10b981]/40 focus:bg-[#12331e]/20 transition-all font-mono placeholder:text-gray-400 disabled:opacity-50 disabled:text-gray-400"
                  placeholder={
                    formData.isAnonymous
                      ? "Laporan Anonim"
                      : "Ketik nama lengkap..."
                  }
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={formData.isAnonymous}
                />
              </div>
              <div className="space-y-3">
                <label
                  htmlFor="email"
                  className="text-[10px] font-mono text-gray-400 uppercase tracking-widest pl-2"
                >
                  Email Akdemik (Opsional)
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full bg-[#12331e]/10 border border-white/5 rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:border-[#10b981]/40 focus:bg-[#12331e]/20 transition-all font-mono placeholder:text-gray-400"
                  placeholder="nim@mhs.unesa.ac.id"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-5">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest pl-2">
                Kategori Aspirasi
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(
                  ["Fasilitas", "Akademik", "Organisasi", "Lainnya"] as const
                ).map((cat, idx) => (
                  <label key={idx} className="relative cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      className="peer sr-only"
                      checked={formData.category === cat}
                      onChange={() =>
                        setFormData({ ...formData, category: cat })
                      }
                    />
                    <div className="px-4 py-4 text-center rounded-xl glass-subtle text-[10px] font-bold text-gray-400 uppercase tracking-widest border-white/5 peer-checked:bg-[#10b981] peer-checked:text-[#091c11] peer-checked:border-[#10b981] transition-all group-hover:border-white/20">
                      {cat}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label
                htmlFor="message"
                className="text-[10px] font-mono text-gray-400 uppercase tracking-widest pl-2"
              >
                Uraian Aspirasi
              </label>
              <textarea
                id="message"
                rows={6}
                required
                className="w-full bg-[#12331e]/10 border border-white/5 rounded-[32px] px-8 py-6 text-sm text-white focus:outline-none focus:border-[#10b981]/40 focus:bg-[#12331e]/20 resize-none transition-all placeholder:text-gray-400"
                placeholder="Sampaikan aspirasi, keluhan, atau saran Anda secara detail di sini..."
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
              />
            </div>

            <div className="flex items-center gap-3 group cursor-pointer w-fit">
              <div className="relative flex items-center">
                <input
                  id="anonymous"
                  type="checkbox"
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/10 bg-white/5 transition-all checked:bg-[#10b981] checked:border-[#10b981]"
                  checked={formData.isAnonymous}
                  onChange={(e) =>
                    setFormData({ ...formData, isAnonymous: e.target.checked })
                  }
                />
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#091c11] opacity-0 peer-checked:opacity-100">
                  <Check className="h-3.5 w-3.5" strokeWidth={4} />
                </div>
              </div>
              <label
                htmlFor="anonymous"
                className="text-xs text-gray-300 cursor-pointer group-hover:text-white transition-colors"
              >
                Kirim sebagai laporan anonim
              </label>
            </div>

            <div className="pt-6">
              <button
                disabled={submitMutation.isPending}
                className="btn-strategic w-full py-6 disabled:opacity-50 text-base flex items-center justify-center gap-3 shadow-[0_10px_40px_-10px_rgba(255,255,255,0.1)]"
              >
                {submitMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    SUBMIT INTELLIGENCE
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
              <div className="flex flex-col items-center gap-2 mt-8">
                <p className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.4em]">
                  ENFORCED BY DEPT. ADKESMA 2026
                </p>
                <div className="w-12 h-px bg-white/5" />
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
