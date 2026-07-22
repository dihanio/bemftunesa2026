"use client";

import React, { useState } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicApiService } from "@/lib/api";
import { FormInput, FormTextarea } from "@/components/ui";
import { Phone, Clock, Send, CheckCircle, AlertTriangle } from "lucide-react";

export default function KontakPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number>(0);

  const faqs = [
    {
      q: "Bagaimana cara meminjam peralatan atau ruang inventaris BEM FT?",
      a: "Peminjaman inventaris dilakukan dengan mengunduh formulir peminjaman di portal IMS, mengisi rincian barang, meminta tanda tangan Ketua Ormawa peminjam, lalu menyerahkannya ke Biro Administrasi/Sekretariat BEM FT Gedung A11 Ruangan A11.02.01 minimal 3 hari sebelum kegiatan."
    },
    {
      q: "Di mana lokasi Sekretariat BEM Fakultas Teknik UNESA?",
      a: "Sekretariat kami berlokasi di Gedung A11 Ruangan A11.02.01, Kampus Ketintang Universitas Negeri Surabaya (UNESA), Fakultas Teknik, Jl. Ketintang, Gayungan, Surabaya. Silakan kunjungi sekretariat kami pada jam operasional kerja."
    },
    {
      q: "Bagaimana alur pengajuan persuratan / proposal kegiatan?",
      a: "Pengajuan surat masuk dan proposal kini terintegrasi secara digital melalui Dashboard IMS. Silakan login menggunakan akun ormawa Anda, unggah dokumen dalam format PDF, lalu pantau status persetujuan secara berkala."
    },
    {
      q: "Bagaimana cara mendaftar kepanitiaan atau menjadi pengurus BEM FT?",
      a: "Setiap rekrutmen panitia kegiatan (Open Recruitment Panitia) maupun kepengurusan BEM (Oprec Fungsionaris) akan dipublikasikan secara resmi di website portal berita ini serta akun Instagram resmi @bemftunesa. Pendaftaran dapat diisi melalui portal oprec."
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Nama lengkap wajib diisi.";
    if (!form.email.trim()) errors.email = "Email wajib diisi.";
    if (!form.subject.trim()) errors.subject = "Subjek pesan wajib diisi.";
    if (!form.message.trim()) errors.message = "Isi pesan wajib diisi.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setError(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await PublicApiService.submitContact(form);
      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      setFieldErrors({});
    } catch (err) {
      console.error("Error submitting contact form:", err);
      setError("Gagal mengirim pesan. Silakan coba kembali beberapa saat.");
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <main className="pt-28 pb-16 px-6 max-w-6xl mx-auto w-full relative">
      {/* Background Ambience */}
      <div className="absolute top-[20%] right-1/4 w-[600px] h-[600px] bg-accent-blue/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "Kontak & Bantuan", isCurrent: true }]} />

      {/* Header */}
      <div className="mb-12 mt-6">
        <span className="text-xs font-semibold text-accent-blue uppercase tracking-wide block mb-3">Pusat Bantuan</span>
        <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-none tracking-tight">
          Hubungi <span className="text-accent-gold">Kami</span>
        </h1>
        <p className="text-sm text-foreground/75 mt-4 max-w-2xl leading-relaxed">
          Punya pertanyaan seputar persuratan, program kerja, atau ingin berkolaborasi? Kirimkan pesan Anda melalui formulir di bawah ini atau kunjungi Sekretariat BEM FT UNESA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-6 items-start">
        {/* Left Side: Contact details & Form (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-8">
          {/* Form */}
          <div className="glass-subtle border border-accent-blue/15 hover:border-accent-gold/30 rounded-3xl p-6 md:p-8">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest border-b border-accent-blue/10 pb-4 mb-6">
              Formulir Pertanyaan
            </h2>
 
            {success ? (
              <div className="p-8 text-center bg-foreground/5 border border-accent-blue/40 rounded-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                <CheckCircle className="w-12 h-12 text-accent-blue" />
                <h3 className="text-foreground font-extrabold text-lg">Pesan Terkirim!</h3>
                <p className="text-xs text-foreground/75 leading-relaxed max-w-sm">
                  Terima kasih. Pesan Anda telah masuk ke Biro Hubungan Masyarakat BEM FT UNESA. Kami akan membalas pesan Anda melalui email secepatnya.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="btn-tactical text-xs px-5 py-2.5 mt-2 cursor-pointer"
                >
                  Kirim Pesan Lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormInput
                    label="Nama Lengkap"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Nama Anda"
                    required
                    error={fieldErrors.name}
                  />
                  <FormInput
                    label="Email Kampus / Umum"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="email@gmail.com"
                    required
                    error={fieldErrors.email}
                  />
                </div>

                <FormInput
                  label="Subjek Pesan"
                  name="subject"
                  value={form.subject}
                  onChange={handleInputChange}
                  placeholder="Judul pesan (cth: Pengajuan Kolaborasi Studi Banding)"
                  required
                  error={fieldErrors.subject}
                />

                <FormTextarea
                  label="Isi Pesan Lengkap"
                  name="message"
                  value={form.message}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Tuliskan detail pertanyaan atau maksud pesan Anda..."
                  required
                  error={fieldErrors.message}
                />
 
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-strategic mt-2 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-accent-gold" />
                  {submitting ? "Mengirim..." : "Kirim Pesan"}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Right Side: FAQ Accordion (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-active border border-accent-blue/15 rounded-3xl p-6 md:p-8 flex flex-col gap-5">
            <h2 className="text-xs font-semibold text-accent-gold uppercase tracking-wide border-b border-accent-blue/15 pb-3">
              Frequently Asked Questions (FAQ)
            </h2>

            {/* Tab Buttons for Questions */}
            <div className="flex flex-col gap-2.5">
              {faqs.map((faq, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFaq(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center gap-3 cursor-pointer ${
                    activeFaq === idx
                      ? "border-accent-gold/40 bg-foreground/5 text-foreground font-semibold shadow-sm"
                      : "border-accent-blue/15 bg-transparent text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                  }`}
                >
                  <span className="text-[10px] font-bold text-accent-gold bg-foreground/5 border border-accent-gold/20 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-[11px] leading-snug font-medium text-foreground tracking-tight line-clamp-2">
                    {faq.q}
                  </span>
                </button>
              ))}
            </div>

            {/* Fixed Height Answer Box without Scrollbar */}
            <div className="glass-subtle border border-accent-blue/10 rounded-2xl p-5 flex flex-col justify-center h-[200px] overflow-hidden">
              <span className="text-[10px] font-semibold text-accent-blue uppercase tracking-wider block mb-2">Jawaban Bantuan</span>
              <p className="text-xs text-foreground/80 leading-relaxed animate-in fade-in slide-in-from-right-4 duration-300">
                {faqs[activeFaq].a}
              </p>
            </div>
          </div>

          {/* Quick info cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-foreground/5 border border-accent-blue/10 hover:border-accent-gold/45 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 flex flex-col gap-2 group">
              <Clock className="w-4 h-4 text-accent-gold" />
              <span className="text-xs text-foreground/50">JAM OPERASIONAL</span>
              <span className="text-[11px] font-bold text-foreground">Senin - Jumat</span>
              <span className="text-[9px] text-accent-gold font-bold">08:00 - 16:00 WIB</span>
            </div>
            <div className="p-5 rounded-2xl bg-foreground/5 border border-accent-blue/10 hover:border-accent-gold/45 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 flex flex-col gap-2 group">
              <Phone className="w-4 h-4 text-accent-gold" />
              <span className="text-xs text-foreground/50">HUMAS HUBUNGI</span>
              <span className="text-[11px] font-bold text-foreground">WhatsApp Bot</span>
              <span className="text-[9px] text-accent-gold font-bold">+62 821-3456-7890</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
