"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowRight, MailCheck, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import AmbiencePlayer from "@/components/landing/AmbiencePlayer";
import { authApi } from "@/features/auth/api/auth.api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlEmail = searchParams.get("email") || "";
  const urlCode = searchParams.get("code") || searchParams.get("token") || "";

  const [email, setEmail] = useState(urlEmail);
  const [code, setCode] = useState(urlCode);
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(urlCode ? "verifying" : "idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const handleAutoVerify = useCallback(async (emailToVerify: string, codeToVerify: string) => {
    setStatus("verifying");
    setErrorMessage("");
    try {
      await authApi.verifyEmailCode(emailToVerify, codeToVerify);
      setStatus("success");
      setSuccessMessage("Email berhasil dikonfirmasi! Akun Anda telah aktif.");
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 2500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setStatus("error");
      setErrorMessage(error.response?.data?.message || "Kode verifikasi tidak valid atau telah kedaluwarsa.");
    }
  }, [router]);

  useEffect(() => {
    if (urlCode && urlEmail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleAutoVerify(urlEmail, urlCode);
    }
  }, [urlCode, urlEmail, handleAutoVerify]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      setErrorMessage("Email dan Kode Verifikasi wajib diisi.");
      return;
    }
    await handleAutoVerify(email, code);
  };

  const handleResendCode = async () => {
    if (!email) {
      setErrorMessage("Masukkan alamat email untuk mengirim ulang kode.");
      return;
    }
    setIsResending(true);
    setErrorMessage("");
    try {
      const res = await authApi.resendVerificationCode(email);
      setSuccessMessage(res.message || "Kode konfirmasi baru telah dikirimkan ke email Anda.");
      setResendCooldown(60);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMessage(error.response?.data?.message || "Gagal mengirim ulang kode. Silakan coba lagi nanti.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#040507] text-[#FAFAFA] font-sans flex flex-col justify-between overflow-x-hidden overflow-y-auto pb-12">
      
      {/* Background Architectural Canvas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Image
          src="/gedung_ft_new.jpeg"
          alt="Gedung FT UNESA Background"
          fill
          className="object-cover grayscale opacity-30 filter contrast-125"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040507] via-[#040507]/80 to-[#040507]" />
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(212,175,55,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] bg-[#D4AF37]/15 rounded-full blur-[180px]" />
      </div>

      {/* Floating Centered Header */}
      <header className="relative z-50 p-6 sm:p-8 flex items-center justify-between pointer-events-auto">
        {/* Left Slot (Spacer for Centering Alignment) */}
        <div className="flex-1 hidden md:block" />

        {/* Center Slot: Centered & Enlarged Logo Trio */}
        <div className="flex-1 flex justify-start md:justify-center items-center">
          <Link href="/" className="flex items-center gap-4 sm:gap-6 bg-[#040507]/60 px-5 sm:px-6 py-2 rounded-full border border-[#D4AF37]/20 backdrop-blur-md shadow-lg shadow-[#D4AF37]/5 hover:border-[#D4AF37]/40 transition-all">
            <Image src="/logobemft.png" alt="BEM FT" width={48} height={48} className="object-contain h-9 sm:h-12 w-auto drop-shadow-[0_0_12px_rgba(212,175,55,0.2)]" />
            <Image src="/logo_kabinet.png" alt="Kabinet BEM FT" width={48} height={48} className="object-contain h-9 sm:h-12 w-auto drop-shadow-[0_0_12px_rgba(212,175,55,0.2)]" />
            <Image src="/logo_adrata.png" alt="PKKMB Adrata" width={52} height={52} className="object-contain h-10 sm:h-13 w-auto drop-shadow-[0_0_12px_rgba(212,175,55,0.2)]" />
          </Link>
        </div>
        
        {/* Right Slot: Ambience + Masuk Button */}
        <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4">
          <AmbiencePlayer />
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 h-10 text-xs font-mono tracking-[0.15em] text-[#D4AF37] border border-[#D4AF37]/35 bg-[#040507]/40 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] transition-all uppercase rounded-sm shadow-md"
          >
            <span>MASUK</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-20 max-w-xl mx-auto px-6 py-12 w-full my-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37]">
            {status === "verifying" ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : status === "success" ? (
              <CheckCircle2 className="w-8 h-8 text-[#D4AF37]" />
            ) : (
              <MailCheck className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[#D4AF37]/80 font-mono text-xs tracking-[0.4em] uppercase block">
              KONFIRMASI EMAIL &middot; PKKMB FT UNESA 2026
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Verifikasi Email Akun
            </h1>
            <p className="text-[#8E8E93] text-sm font-light max-w-md mx-auto leading-relaxed">
              {email ? (
                <>Kode verifikasi 6-digit telah dikirimkan ke <span className="text-[#D4AF37] font-mono">{email}</span>.</>
              ) : (
                "Masukkan alamat email dan kode verifikasi 6-digit untuk mengaktifkan akun portalmu."
              )}
            </p>
          </div>

          {/* SUCCESS STATE */}
          {status === "success" && (
            <div className="p-6 border border-[#D4AF37]/30 bg-[#040507]/90 backdrop-blur-md space-y-4">
              <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono">
                {successMessage || "Email berhasil diverifikasi! Mengalihkan ke halaman masuk..."}
              </div>
              <Link
                href="/login"
                className="w-full py-3.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-bold font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <span>MASUK KE KONSOL SEKARANG</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* VERIFY FORM (IDLE / ERROR STATE) */}
          {status !== "success" && (
            <form onSubmit={handleManualVerify} className="p-6 border border-[#D4AF37]/30 bg-[#040507]/90 backdrop-blur-md space-y-5 text-left">
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && !errorMessage && (
                <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono">
                  {successMessage}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email_verify" className="text-[11px] font-mono text-[#D4AF37] tracking-widest block uppercase">
                  EMAIL MAHASISWA
                </label>
                <input
                  type="email"
                  id="email_verify"
                  className="w-full bg-[#040507] border border-[#D4AF37]/30 px-4 py-3 text-[#FAFAFA] font-sans text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@mhs.unesa.ac.id"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="code_verify" className="text-[11px] font-mono text-[#D4AF37] tracking-widest block uppercase">
                  KODE VERIFIKASI (6 DIGIT)
                </label>
                <input
                  type="text"
                  id="code_verify"
                  maxLength={6}
                  className="w-full bg-[#040507] border border-[#D4AF37]/30 px-4 py-3 text-center text-xl font-mono tracking-[0.5em] text-[#D4AF37] uppercase focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="123456"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={status === "verifying"}
                className="w-full py-4 bg-[#D4AF37] hover:bg-amber-400 disabled:bg-[#334155] text-black disabled:text-[#94a3b8] font-bold font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-amber-300 cursor-pointer disabled:cursor-not-allowed"
              >
                {status === "verifying" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>MEMVERIFIKASI KODE...</span>
                  </>
                ) : (
                  <>
                    <span>VERIFIKASI & AKTIFKAN AKUN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend Code Option */}
              <div className="pt-2 flex justify-between items-center text-xs font-mono">
                <span className="text-[#8E8E93]">Tidak menerima kode?</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isResending}
                  className="text-[#D4AF37] hover:underline disabled:text-[#8E8E93] flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {resendCooldown > 0 ? `Kirim Ulang (${resendCooldown}s)` : "Kirim Ulang Kode"}
                  </span>
                </button>
              </div>
            </form>
          )}

        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 p-6 text-center font-mono text-[10px] text-[#8E8E93]/60 tracking-widest uppercase border-t border-[#D4AF37]/15">
        &copy; 2026 BEM FT UNESA &middot; KABINET DANADYAKSA &middot; SURABAYA
      </footer>

    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
