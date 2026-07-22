"use client";

import React, { useState } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicApiService } from "@/lib/api";
import { FormInput, FormTextarea, FormSelect } from "@/components/ui";
import { Send, Eye, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AspirasiPage() {
  // Submission Form State
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "Akademik"
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Tracking State
  const [trackingId, setTrackingId] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedData, setTrackedData] = useState<{ _id: string; status: string; category: string; createdAt: string; subject: string; message: string; response?: string } | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const categories = ["Akademik", "Fasilitas", "Kesejahteraan", "Birokrasi", "Lainnya"];
  const categoryOptions = categories.map((cat) => ({ value: cat, label: cat }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    }
  };

  const handleCategoryChange = (value: string) => {
    setForm((prev) => ({ ...prev, category: value }));
    if (fieldErrors.category) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next.category; return next; });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.subject.trim()) errors.subject = "Subjek pengaduan wajib diisi.";
    if (!form.message.trim()) errors.message = "Pesan detail wajib diisi.";
    if (!form.category) errors.category = "Kategori wajib dipilih.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setSubmitError(null);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await PublicApiService.submitAspirasi({
        name: form.name ? form.name : undefined,
        email: form.email ? form.email : undefined,
        subject: form.subject,
        message: form.message,
        category: form.category
      });
      const resData = 'data' in (res?.data || {}) ? (res.data as unknown as { data: { id: string } }).data : res?.data;
      if (resData?.id) {
        setSubmitSuccess(resData.id);
        // Clear form
        setForm({ name: "", email: "", subject: "", message: "", category: "Akademik" });
        setFieldErrors({});
      } else {
        setSubmitError("Gagal mengirim aspirasi. Silakan coba kembali.");
      }
    } catch (err) {
      console.error("Error submitting aspiration:", err);
      setSubmitError("Terjadi kesalahan pada server. Harap coba lagi beberapa saat.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      setTrackingError("Harap masukkan ID Tiket.");
      return;
    }

    setTrackingLoading(true);
    setTrackingError(null);
    setTrackedData(null);

    try {
      const res = await PublicApiService.getAspirationStatus(trackingId.trim());
      if (res?.data) {
        setTrackedData(res.data);
      } else {
        setTrackingError("Aspirasi tidak ditemukan. Cek kembali ID Tiket Anda.");
      }
    } catch (err) {
      console.error("Error tracking aspiration:", err);
      setTrackingError("ID Tiket tidak valid atau tidak terdaftar.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "done":
      case "resolved":
        return "text-accent-blue border-accent-blue/35 bg-accent-blue/10";
      case "reviewed":
      case "process":
        return "text-accent-gold border-accent-gold/30 bg-accent-gold/10";
      default:
        return "text-foreground/50 border-accent-blue/10 bg-black/5 dark:bg-slate-800/5";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "done":
      case "resolved":
        return "SELESAI / DITINDAKLANJUTI";
      case "reviewed":
      case "process":
        return "SEDANG DITINJAU / PROSES";
      default:
        return "MENUNGGU VERIFIKASI";
    }
  };

  return (
    <main className="pt-28 pb-16 px-6 max-w-6xl mx-auto w-full relative">
      {/* Background Ambience */}
      <div className="absolute top-[20%] left-1/4 w-[600px] h-[600px] bg-accent-blue/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "Kanal Advokasi & Aspirasi", isCurrent: true }]} />

      {/* Header */}
      <div className="mb-12 mt-6">
        <span className="text-xs font-semibold text-accent-blue uppercase tracking-wide block mb-3">Kanal Advokasi</span>
        <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
          Kanal <span className="text-accent-gold">Aspirasi</span>
        </h1>
        <p className="text-sm text-foreground/70 mt-4 max-w-2xl leading-relaxed">
          Kanal resmi advokasi mahasiswa Teknik UNESA. Sampaikan kendala fasilitas kuliah, banding UKT, birokrasi kampus, atau saran demi kemajuan fakultas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-6 items-start">
        {/* Submit Form Area (7 Cols) */}
        <section className="lg:col-span-7 bg-white dark:bg-transparent shadow-sm dark:shadow-none glass-subtle border border-accent-blue/15 hover:border-accent-gold/30 rounded-3xl p-6 md:p-8">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-widest border-b border-accent-blue/10 pb-4 mb-6">
            Formulir Pengaduan
          </h2>

          {submitSuccess ? (
            <div className="p-8 text-center bg-black/5 dark:bg-slate-800/20 border border-accent-blue/40 rounded-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
              <CheckCircle className="w-12 h-12 text-accent-blue" />
              <h3 className="text-foreground font-extrabold text-lg">Aspirasi Berhasil Dikirim!</h3>
              <p className="text-xs text-foreground/85 leading-relaxed max-w-sm">
                Aspirasi Anda telah masuk ke sistem database. Harap simpan ID Tiket di bawah ini untuk melacak status respon dari pengurus BEM.
              </p>
              <div className="bg-black/10 dark:bg-slate-800/10 border border-accent-blue/30 rounded-xl px-4 py-3 font-mono text-xs text-accent-gold select-all font-bold tracking-wider my-2">
                {submitSuccess}
              </div>
              <button
                onClick={() => setSubmitSuccess(null)}
                className="btn-tactical text-xs px-5 py-2.5 mt-2"
              >
                Kirim Aspirasi Baru
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {submitError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Row: Name (optional) & Email (optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormInput
                  label="Nama (Boleh Dikosongkan)"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Anonim / Nama Anda"
                />
                <FormInput
                  label="Email (Boleh Dikosongkan)"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="email@mhs.unesa.ac.id"
                />
              </div>

              {/* Row: Category */}
              <FormSelect
                label="Kategori Pengaduan"
                name="category"
                value={form.category}
                onChange={handleCategoryChange}
                options={categoryOptions}
                placeholder="Pilih kategori..."
                required
                error={fieldErrors.category}
              />

              {/* Row: Subject */}
              <FormInput
                label="Subjek / Judul Pengaduan"
                name="subject"
                value={form.subject}
                onChange={handleInputChange}
                placeholder="Ringkasan kendala (cth: AC Ruang A1.02 Mati)"
                required
                error={fieldErrors.subject}
              />

              {/* Row: Message */}
              <FormTextarea
                label="Pesan Detail Pengaduan"
                name="message"
                value={form.message}
                onChange={handleInputChange}
                rows={5}
                placeholder="Jelaskan secara rinci mengenai kendala, lokasi, dan kronologi..."
                required
                error={fieldErrors.message}
              />

              <button
                type="submit"
                disabled={submitting}
                className="btn-strategic mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-accent-gold" />
                {submitting ? "Mengirim..." : "Kirim Aspirasi"}
              </button>
            </form>
          )}
        </section>

        {/* Tracker Area (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-8">
          {/* Tracker box */}
          <div className="bg-white dark:bg-transparent shadow-sm dark:shadow-none glass-active border border-accent-blue/15 rounded-3xl p-6 md:p-8">
            <h2 className="text-xs font-semibold text-accent-gold uppercase tracking-wide border-b border-accent-blue/15 pb-3 mb-6">
              Track Aspiration Ticket
            </h2>

            <form onSubmit={handleTrack} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="trackingId" className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Masukkan ID Tiket Aspirasi</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="trackingId"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="Cth: 65cb68d..."
                    className="flex-grow px-4.5 py-3 rounded-xl bg-black/5 dark:bg-slate-800/60 border border-accent-blue/15 text-xs text-foreground placeholder-foreground/50 focus:outline-none focus:border-accent-gold transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={trackingLoading}
                    className="btn-strategic text-xs px-4 py-3 shrink-0 flex items-center justify-center disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4 text-accent-gold" />
                  </button>
                </div>
              </div>
              {trackingError && (
                <span className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {trackingError}
                </span>
              )}
            </form>

            {/* Tracker Details Results */}
            <AnimatePresence>
              {trackedData && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 border-t border-accent-blue/10 pt-6 flex flex-col gap-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-foreground/50">STATUS PENGADUAN</span>
                    <span className={`px-2.5 py-1 rounded-lg border text-xs uppercase font-bold tracking-wider ${getStatusColor(trackedData.status)}`}>
                      {getStatusLabel(trackedData.status)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 p-4 rounded-xl bg-black/5 dark:bg-slate-800/60 border border-accent-blue/10">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-foreground/50">SUBJEK PENGADUAN</span>
                      <span className="text-xs text-foreground font-bold">{trackedData.subject || "No Subject"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 mt-2">
                      <span className="text-xs text-foreground/50">PESAN / MASUKAN</span>
                      <p className="text-[11px] text-foreground/80 leading-normal line-clamp-3">{trackedData.message}</p>
                    </div>
                  </div>

                  {/* BEM Response */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-accent-gold uppercase tracking-widest">Respon Fungsionaris BEM</span>
                    <div className="p-4.5 rounded-xl bg-black/5 dark:bg-slate-800/20 border border-accent-blue/20 text-xs text-foreground/80 leading-relaxed min-h-[60px]">
                      {trackedData.response ? (
                        <p>{trackedData.response}</p>
                      ) : (
                        <p className="italic text-foreground/50 text-[11px] flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-accent-gold" />
                          Aspirasi sedang dianalisis oleh Departemen Advokesma. Kami akan segera merespon tiket Anda.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </main>
  );
}
