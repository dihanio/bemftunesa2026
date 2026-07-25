"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/features/auth/api/auth.api";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, MailCheck, RefreshCw, AlertCircle } from "lucide-react";
import AmbiencePlayer from "@/components/landing/AmbiencePlayer";

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
}

type AuthMode = "LOGIN" | "REGISTER" | "VERIFY";

function AuthContent() {
  const { user, isLoading, fetchMe } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if verified query parameter is present in URL
  const urlVerified = searchParams.get("verified") === "true";

  // Mode state: LOGIN vs REGISTER vs VERIFY
  const [authMode, setAuthMode] = useState<AuthMode>("LOGIN");

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Login form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Portal transition overlay state
  const [isPortalOpening, setIsPortalOpening] = useState(false);

  // Register form states
  const [regData, setRegData] = useState({
    name: "",
    nim: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Email Verification states
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Email correction states
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");

  // Navigation transition overlay state
  const [isNavigatingToHome, setIsNavigatingToHome] = useState(false);

  const handleBerandaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigatingToHome(true);
    setTimeout(() => {
      router.push("/");
    }, 650);
  };

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!email || !password) {
      setLoginError("Email / NIM dan Password wajib diisi.");
      return;
    }

    setIsLoggingIn(true);
    try {
      await authApi.loginMaba(email, password);
      await fetchMe();

      // Trigger Portal Opening transition animation
      setIsPortalOpening(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1400);
    } catch (err: unknown) {
      const error = err as ApiErrorResponse;
      const errorMsg = error.response?.data?.message;
      
      if (typeof errorMsg === "string" && errorMsg.toLowerCase().includes("verifikasi")) {
        setVerifyEmail(email);
        setAuthMode("VERIFY");
        setVerifyError("Email Anda belum diverifikasi. Masukkan kode konfirmasi yang telah dikirimkan.");
      } else {
        setLoginError(
          typeof errorMsg === "string"
            ? errorMsg
            : Array.isArray(errorMsg)
            ? errorMsg.join(", ")
            : "Login gagal. Periksa kembali Email/NIM dan Password Anda."
        );
      }
      setIsLoggingIn(false);
    }
  };

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setRegData((prev) => ({ ...prev, [id]: value }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!regData.name || !regData.email || !regData.phone || !regData.password || !regData.confirmPassword) {
      setRegError("Mohon lengkapi semua isian yang wajib diisi.");
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setRegError("Password dan Konfirmasi Password tidak cocok.");
      return;
    }
    if (regData.password.length < 8) {
      setRegError("Password minimal 8 karakter.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regData.email)) {
      setRegError("Format email tidak valid.");
      return;
    }

    setIsRegistering(true);
    try {
      await authApi.registerMaba({
        name: regData.name,
        nim: regData.nim,
        email: regData.email,
        phone: regData.phone,
        password: regData.password,
      });

      // Transition to Email Verification Mode
      setVerifyEmail(regData.email);
      setEmail(regData.email);
      setAuthMode("VERIFY");
      setVerifySuccess(`Pendaftaran berhasil! Kode konfirmasi 6-digit telah dikirimkan ke email ${regData.email}`);
      setResendCooldown(60);
      setRegData({ name: "", nim: "", email: "", phone: "", password: "", confirmPassword: "" });
    } catch (err: unknown) {
      const error = err as ApiErrorResponse;
      const errorMsg = error.response?.data?.message;
      const strMsg = typeof errorMsg === "string" ? errorMsg : Array.isArray(errorMsg) ? errorMsg.join(", ") : "";

      // If NIM or Email is already registered but unverified, auto-route to VERIFY mode
      if (strMsg.toLowerCase().includes("terdaftar") || strMsg.toLowerCase().includes("exist") || strMsg.toLowerCase().includes("nim")) {
        setVerifyEmail(regData.email);
        setEmail(regData.email);
        setAuthMode("VERIFY");
        setVerifyError(`NIM / Email ${regData.email} sudah terdaftar tetapi belum terverifikasi. Silakan masukkan kode konfirmasi atau klik 'Salah Email?' jika ingin mengoreksi email.`);
        authApi.resendVerificationCode(regData.email).catch(() => {});
      } else {
        setRegError(strMsg || "Registrasi gagal. Silakan coba lagi.");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError("");
    setVerifySuccess("");

    if (!verifyEmail || !verifyCode) {
      setVerifyError("Email dan Kode Verifikasi wajib diisi.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await authApi.verifyEmailCode(verifyEmail, verifyCode);
      setRegSuccess(res.message || "Email berhasil diverifikasi! Akun Anda telah aktif. Silakan masuk.");
      setEmail(verifyEmail);
      setPassword("");
      setAuthMode("LOGIN");
    } catch (err: unknown) {
      const error = err as ApiErrorResponse;
      const errorMsg = error.response?.data?.message;
      setVerifyError(
        typeof errorMsg === "string"
          ? errorMsg
          : "Kode verifikasi tidak valid. Silakan periksa kembali email Anda."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!verifyEmail) return;
    setIsResending(true);
    setVerifyError("");
    try {
      const res = await authApi.resendVerificationCode(verifyEmail);
      setVerifySuccess(res.message || "Kode konfirmasi baru telah dikirimkan ke email.");
      setResendCooldown(60);
    } catch (err: unknown) {
      const error = err as ApiErrorResponse;
      const errorMsg = error.response?.data?.message;
      setVerifyError(typeof errorMsg === "string" ? errorMsg : "Gagal mengirim ulang kode.");
    } finally {
      setIsResending(false);
    }
  };

  const handleUpdateAndResendEmail = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmailInput || !emailRegex.test(newEmailInput)) {
      setVerifyError("Mohon masukkan format email baru yang valid.");
      return;
    }

    setIsResending(true);
    setVerifyError("");
    try {
      const res = await authApi.resendVerificationCode(newEmailInput);
      setVerifyEmail(newEmailInput);
      setEmail(newEmailInput);
      setVerifySuccess(`Email berhasil diperbarui ke ${newEmailInput}! Kode konfirmasi baru telah dikirimkan.`);
      setIsEditingEmail(false);
      setResendCooldown(60);
    } catch (err: unknown) {
      const error = err as ApiErrorResponse;
      const errorMsg = error.response?.data?.message;
      setVerifyError(typeof errorMsg === "string" ? errorMsg : "Gagal memperbarui dan mengirim ulang kode.");
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-[#040507] text-[#FAFAFA] font-sans flex flex-col justify-between overflow-x-hidden overflow-y-auto pb-12">
      
      {/* Full-Bleed Background Architectural Atmosphere */}
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
        <div className="absolute bottom-6 right-6 text-[18rem] font-serif text-[#D4AF37]/[0.025] select-none pointer-events-none leading-none hidden lg:block">
          ꦥꦏꦏꦩꦧ
        </div>
      </div>

      {/* Fixed Top Centered Header Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 sm:p-6 flex items-center justify-between pointer-events-auto bg-[#040507]/90 backdrop-blur-md border-b border-[#D4AF37]/20 shadow-2xl transition-all">
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
        
        {/* Right Slot: Ambience + Beranda Button */}
        <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4">
          <AmbiencePlayer />
          <Link
            href="/"
            onClick={handleBerandaClick}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 h-10 text-xs font-mono tracking-[0.15em] text-[#D4AF37] border border-[#D4AF37]/35 bg-[#040507]/40 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] transition-all uppercase rounded-sm shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BERANDA</span>
          </Link>
        </div>
      </header>

      {/* CENTERED MONUMENTAL EDITORIAL SPREAD WITH 3D CARD FLIP */}
      <main className="relative z-20 max-w-4xl mx-auto px-6 pt-28 sm:pt-36 pb-16 w-full min-h-screen flex flex-col items-center justify-center text-center my-auto">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full space-y-6"
        >
          {/* Tagline */}
          <span className="text-[#D4AF37]/80 font-mono text-xs tracking-[0.4em] uppercase block">
            FAKULTAS TEKNIK UNESA &middot; KABINET DANADYAKSA 2026
          </span>

          {/* Monumental Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-[#FAFAFA]">
            Portal PKKMB <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-amber-100 to-[#C5A059] font-serif italic">
              Fakultas Teknik
            </span>
          </h1>

          <p className="text-[#8E8E93] text-base sm:text-lg font-light max-w-md mx-auto leading-relaxed">
            Masuk untuk melanjutkan perjalananmu di Kampus Ketintang.
          </p>

          {/* 3D PERSPECTIVE CARD FLIP WRAPPER */}
          <div className="w-full max-w-md mx-auto pt-6 pb-4 [perspective:1200px]">
            <motion.div
              animate={{ rotateY: authMode === "LOGIN" ? 0 : 180 }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full h-[520px] sm:h-[490px] [transform-style:preserve-3d]"
            >
              
              {/* FRONT FACE: LOGIN FORM (rotateY = 0deg) */}
              <div className="absolute inset-0 border-t border-b border-[#D4AF37]/25 py-6 px-4 sm:px-6 bg-[#040507]/90 backdrop-blur-md flex flex-col justify-between [backface-visibility:hidden] shadow-2xl">
                {/* Form Mode Header */}
                <div className="flex justify-between items-center border-b border-[#D4AF37]/15 pb-3 font-mono text-xs shrink-0">
                  <span className="text-[#D4AF37] tracking-widest uppercase">01 — MASUK KONSOL</span>
                  <span className="text-[#8E8E93] text-[10px]">KONSOL MAHASISWA</span>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-5 text-left flex-1 flex flex-col justify-between" noValidate>
                  <div className="space-y-5 my-auto py-4">
                    {loginError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}
                    {(regSuccess || urlVerified) && (
                      <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                        <span>{regSuccess || "Email berhasil terverifikasi! Silakan masuk ke akun Anda."}</span>
                      </div>
                    )}

                    {/* Email / NIM Field */}
                    <div className="space-y-2">
                      <label htmlFor="email_login" className="text-[11px] font-mono text-[#D4AF37] tracking-widest block uppercase">
                        EMAIL ATAU NIM MAHASISWA
                      </label>
                      <input 
                        type="text" 
                        id="email_login" 
                        className="w-full bg-[#040507] border border-[#D4AF37]/30 px-4 py-3 text-[#FAFAFA] font-sans text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@mhs.unesa.ac.id atau 26050..."
                        required
                      />
                    </div>

                    {/* Password Field with Show/Hide Toggle */}
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-[11px] font-mono text-[#D4AF37] tracking-widest block uppercase">
                        PASSWORD
                      </label>
                      <div className="relative flex items-center">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          id="password" 
                          className="w-full bg-[#040507] border border-[#D4AF37]/30 px-4 py-3 pr-10 text-[#FAFAFA] font-sans text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                          className="absolute right-3 text-[#8E8E93] hover:text-[#D4AF37] transition-colors focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button & Link */}
                  <div className="space-y-3 pt-4 border-t border-[#D4AF37]/15 shrink-0">
                    <button
                      type="submit"
                      disabled={isLoggingIn || isPortalOpening}
                      className="w-full py-3.5 bg-[#D4AF37] hover:bg-amber-400 disabled:bg-[#334155] text-black disabled:text-[#94a3b8] font-bold font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-amber-300 shadow-lg shadow-[#D4AF37]/10 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>MEMVERIFIKASI...</span>
                        </>
                      ) : (
                        <>
                          <span>MASUK KONSOL PORTAL</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="text-center">
                      <p className="text-xs text-[#8E8E93]">
                        Belum punya akun?{" "}
                        <button
                          type="button"
                          onClick={() => setAuthMode("REGISTER")}
                          className="text-[#D4AF37] font-semibold hover:underline bg-transparent border-none cursor-pointer"
                        >
                          Daftar di sini
                        </button>
                      </p>
                    </div>
                  </div>
                </form>
              </div>

              {/* BACK FACE: REGISTER OR VERIFY FORM (rotateY = 180deg) */}
              <div className="absolute inset-0 border-t border-b border-[#D4AF37]/25 py-6 px-4 sm:px-6 bg-[#040507]/90 backdrop-blur-md flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-2xl">
                
                {/* Form Mode Header */}
                <div className="flex justify-between items-center border-b border-[#D4AF37]/15 pb-3 font-mono text-xs shrink-0">
                  <span className="text-[#D4AF37] tracking-widest uppercase">
                    {authMode === "REGISTER" ? "02 — REGISTRASI AKUN" : "03 — KONFIRMASI EMAIL"}
                  </span>
                  <span className="text-[#8E8E93] text-[10px]">
                    {authMode === "REGISTER" ? "MABA 2026" : "VERIFIKASI EMAIL"}
                  </span>
                </div>

                {/* 02: REGISTER FORM */}
                {authMode === "REGISTER" && (() => {
                  const isNameValid = regData.name.trim().length >= 3;
                  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regData.email);
                  const isPhoneValid = /^\d{10,14}$/.test(regData.phone.replace(/[-\s]/g, ""));
                  const isPasswordLengthValid = regData.password.length >= 8;
                  const isPasswordMatchValid = regData.confirmPassword.length > 0 && regData.confirmPassword === regData.password;

                  return (
                    <form onSubmit={handleRegisterSubmit} className="space-y-3 text-left flex-1 flex flex-col justify-between" noValidate>
                      <div className="space-y-2.5 my-auto">
                        {regError && (
                          <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <span>{regError}</span>
                          </div>
                        )}

                        {/* Real-time Requirements Status Checklist */}
                        <div className="p-2 bg-[#040507] border border-[#D4AF37]/20 rounded text-[9px] font-mono text-[#8E8E93] flex flex-wrap justify-between items-center gap-1">
                          <span className={isNameValid ? "text-[#D4AF37] font-bold flex items-center gap-0.5" : "opacity-60 flex items-center gap-0.5"}>
                            {isNameValid ? "✓ Nama Valid" : "○ Nama 3+ Huruf"}
                          </span>
                          <span className={isEmailValid ? "text-[#D4AF37] font-bold flex items-center gap-0.5" : "opacity-60 flex items-center gap-0.5"}>
                            {isEmailValid ? "✓ Email Valid" : "○ Email @unesa"}
                          </span>
                          <span className={isPhoneValid ? "text-[#D4AF37] font-bold flex items-center gap-0.5" : "opacity-60 flex items-center gap-0.5"}>
                            {isPhoneValid ? "✓ WA Valid" : "○ No. WA 10+"}
                          </span>
                          <span className={isPasswordLengthValid && isPasswordMatchValid ? "text-[#D4AF37] font-bold flex items-center gap-0.5" : "opacity-60 flex items-center gap-0.5"}>
                            {isPasswordLengthValid && isPasswordMatchValid ? "✓ Password Cocok" : "○ Pass 8+ & Match"}
                          </span>
                        </div>

                        {/* Nama Lengkap */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono text-[#D4AF37] tracking-widest uppercase">
                            <label htmlFor="name">NAMA LENGKAP</label>
                            {regData.name.length > 0 && (
                              <span className={isNameValid ? "text-[#D4AF37] text-[9px]" : "text-red-400 text-[9px]"}>
                                {isNameValid ? "✓ Sesuai" : "✕ Min 3 Karakter"}
                              </span>
                            )}
                          </div>
                          <div className="relative flex items-center">
                            <input 
                              type="text" 
                              id="name" 
                              className={`w-full bg-[#040507] border px-3 py-1.5 pr-7 text-[#FAFAFA] font-sans text-xs focus:outline-none transition-all ${
                                regData.name.length === 0 
                                  ? "border-[#D4AF37]/30 focus:border-[#D4AF37]" 
                                  : isNameValid 
                                  ? "border-[#D4AF37]/80 bg-[#D4AF37]/5" 
                                  : "border-red-500/50 bg-red-500/5"
                              }`}
                              value={regData.name}
                              onChange={handleRegChange}
                              placeholder="Nama Sesuai Berkas"
                              required
                            />
                            {regData.name.length > 0 && (
                              <div className="absolute right-2 pointer-events-none">
                                {isNameValid ? <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" /> : <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Email Mahasiswa */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono text-[#D4AF37] tracking-widest uppercase">
                            <label htmlFor="email">EMAIL MAHASISWA</label>
                            {regData.email.length > 0 && (
                              <span className={isEmailValid ? "text-[#D4AF37] text-[9px]" : "text-red-400 text-[9px]"}>
                                {isEmailValid ? "✓ Format Valid" : "✕ Email Tidak Valid"}
                              </span>
                            )}
                          </div>
                          <div className="relative flex items-center">
                            <input 
                              type="email" 
                              id="email" 
                              className={`w-full bg-[#040507] border px-3 py-1.5 pr-7 text-[#FAFAFA] font-sans text-xs focus:outline-none transition-all ${
                                regData.email.length === 0 
                                  ? "border-[#D4AF37]/30 focus:border-[#D4AF37]" 
                                  : isEmailValid 
                                  ? "border-[#D4AF37]/80 bg-[#D4AF37]/5" 
                                  : "border-red-500/50 bg-red-500/5"
                              }`}
                              value={regData.email}
                              onChange={handleRegChange}
                              placeholder="email@mhs.unesa.ac.id"
                              required
                            />
                            {regData.email.length > 0 && (
                              <div className="absolute right-2 pointer-events-none">
                                {isEmailValid ? <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" /> : <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Grid: NIM & Phone */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label htmlFor="nim" className="text-[10px] font-mono text-[#D4AF37] tracking-widest block uppercase">
                              NIM (OPSIONAL)
                            </label>
                            <input 
                              type="text" 
                              id="nim" 
                              className="w-full bg-[#040507] border border-[#D4AF37]/30 px-3 py-1.5 text-[#FAFAFA] font-sans text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                              value={regData.nim}
                              onChange={handleRegChange}
                              placeholder="Jika ada"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-mono text-[#D4AF37] tracking-widest uppercase">
                              <label htmlFor="phone">NO. WA</label>
                              {regData.phone.length > 0 && (
                                <span className={isPhoneValid ? "text-[#D4AF37] text-[9px]" : "text-red-400 text-[9px]"}>
                                  {isPhoneValid ? "✓ Valid" : "✕ 10-14 Digit"}
                                </span>
                              )}
                            </div>
                            <div className="relative flex items-center">
                              <input 
                                type="text" 
                                id="phone" 
                                className={`w-full bg-[#040507] border px-3 py-1.5 pr-7 text-[#FAFAFA] font-sans text-xs focus:outline-none transition-all ${
                                  regData.phone.length === 0 
                                    ? "border-[#D4AF37]/30 focus:border-[#D4AF37]" 
                                    : isPhoneValid 
                                    ? "border-[#D4AF37]/80 bg-[#D4AF37]/5" 
                                    : "border-red-500/50 bg-red-500/5"
                                }`}
                                value={regData.phone}
                                onChange={handleRegChange}
                                placeholder="081234567890"
                                required
                              />
                              {regData.phone.length > 0 && (
                                <div className="absolute right-2 pointer-events-none">
                                  {isPhoneValid ? <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" /> : <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Grid: Password & Confirm */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label htmlFor="password" className="text-[10px] font-mono text-[#D4AF37] tracking-widest block uppercase">
                              PASSWORD
                            </label>
                            <div className="relative flex items-center">
                              <input 
                                type="password" 
                                id="password" 
                                className={`w-full bg-[#040507] border px-3 py-1.5 pr-7 text-[#FAFAFA] font-sans text-xs focus:outline-none transition-all ${
                                  regData.password.length === 0 
                                    ? "border-[#D4AF37]/30 focus:border-[#D4AF37]" 
                                    : isPasswordLengthValid 
                                    ? "border-[#D4AF37]/80 bg-[#D4AF37]/5" 
                                    : "border-red-500/50 bg-red-500/5"
                                }`}
                                value={regData.password}
                                onChange={handleRegChange}
                                placeholder="Min 8 karakter"
                                required
                              />
                              {regData.password.length > 0 && (
                                <div className="absolute right-2 pointer-events-none">
                                  {isPasswordLengthValid ? <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" /> : <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label htmlFor="confirmPassword" className="text-[10px] font-mono text-[#D4AF37] tracking-widest block uppercase">
                              KONFIRMASI
                            </label>
                            <div className="relative flex items-center">
                              <input 
                                type="password" 
                                id="confirmPassword" 
                                className={`w-full bg-[#040507] border px-3 py-1.5 pr-7 text-[#FAFAFA] font-sans text-xs focus:outline-none transition-all ${
                                  regData.confirmPassword.length === 0 
                                    ? "border-[#D4AF37]/30 focus:border-[#D4AF37]" 
                                    : isPasswordMatchValid 
                                    ? "border-[#D4AF37]/80 bg-[#D4AF37]/5" 
                                    : "border-red-500/50 bg-red-500/5"
                                }`}
                                value={regData.confirmPassword}
                                onChange={handleRegChange}
                                placeholder="Ulangi password"
                                required
                              />
                              {regData.confirmPassword.length > 0 && (
                                <div className="absolute right-2 pointer-events-none">
                                  {isPasswordMatchValid ? <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" /> : <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-[#D4AF37]/15 shrink-0">
                        <button
                          type="submit"
                          disabled={isRegistering}
                          className="w-full py-3.5 bg-[#D4AF37] hover:bg-amber-400 disabled:bg-[#334155] text-black disabled:text-[#94a3b8] font-bold font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-amber-300 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isRegistering ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-black" />
                              <span>MEMDRAF AKUN...</span>
                            </>
                          ) : (
                            <>
                              <span>DAFTAR & KIRIM KODE EMAIL</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>

                        <div className="text-center">
                          <p className="text-xs text-[#8E8E93]">
                            Sudah punya akun?{" "}
                            <button
                              type="button"
                              onClick={() => setAuthMode("LOGIN")}
                              className="text-[#D4AF37] font-semibold hover:underline bg-transparent border-none cursor-pointer"
                            >
                              Masuk di sini
                            </button>
                          </p>
                        </div>
                      </div>
                    </form>
                  );
                })()}
                {/* 03: EMAIL VERIFICATION MODE */}
                {authMode === "VERIFY" && (
                  <form onSubmit={handleVerifySubmit} className="space-y-4 text-left flex-1 flex flex-col justify-between" noValidate>
                    <div className="space-y-3.5 my-auto">
                      {!isEditingEmail ? (
                        <div className="flex items-center justify-between p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <MailCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                            <span className="truncate">Kode dikirim ke <strong className="text-white">{verifyEmail}</strong></span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNewEmailInput(verifyEmail);
                              setIsEditingEmail(true);
                            }}
                            className="text-[10px] underline text-[#D4AF37] hover:text-white shrink-0 ml-2 cursor-pointer font-bold uppercase"
                          >
                            Salah Email?
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-[#040507] border border-[#D4AF37]/50 rounded space-y-2 text-xs font-mono">
                          <div className="flex justify-between items-center text-[#D4AF37] text-[10px] tracking-widest uppercase">
                            <span>KOREKSI ALAMAT EMAIL</span>
                            <button
                              type="button"
                              onClick={() => setIsEditingEmail(false)}
                              className="text-red-400 hover:underline cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={newEmailInput}
                              onChange={(e) => setNewEmailInput(e.target.value)}
                              className="flex-1 bg-[#040507] border border-[#D4AF37]/30 px-3 py-1 text-[#FAFAFA] text-xs focus:outline-none focus:border-[#D4AF37]"
                              placeholder="nama@mhs.unesa.ac.id"
                            />
                            <button
                              type="button"
                              onClick={handleUpdateAndResendEmail}
                              disabled={isResending || !newEmailInput || newEmailInput === verifyEmail}
                              className="px-2.5 py-1 bg-[#D4AF37] text-black font-bold text-[10px] uppercase hover:bg-amber-400 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                            >
                              {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Simpan & Kirim Ulang"}
                            </button>
                          </div>
                        </div>
                      )}

                      {verifyError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>{verifyError}</span>
                        </div>
                      )}
                      {verifySuccess && !verifyError && (
                        <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono">
                          {verifySuccess}
                        </div>
                      )}

                      {/* DEV MODE TEST CODE HELPER */}
                      <div className="p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded text-left space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#D4AF37] font-bold uppercase">
                          <span>💡 KODE KONFIRMASI PENGUJIAN</span>
                          <button 
                            type="button" 
                            onClick={() => setVerifyCode("123456")} 
                            className="underline hover:text-white cursor-pointer"
                          >
                            Isi Kode 123456
                          </button>
                        </div>
                        <p className="text-[10px] text-[#8E8E93] leading-tight">
                          Kode simulasi pengujian lokal saat ini: <strong className="text-white font-mono">123456</strong> (karena server SMTP email publik diatur dalam mode simulasi dev).
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="verify_code_input" className="text-[11px] font-mono text-[#D4AF37] tracking-widest block uppercase">
                          KODE KONFIRMASI (6 DIGIT)
                        </label>
                        <input
                          type="text"
                          id="verify_code_input"
                          maxLength={6}
                          className="w-full bg-[#040507] border border-[#D4AF37]/30 px-4 py-3 text-center text-xl font-mono tracking-[0.5em] text-[#D4AF37] uppercase focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                          placeholder="123456"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-[#D4AF37]/15 shrink-0">
                      <button
                        type="submit"
                        disabled={isVerifying}
                        className="w-full py-3.5 bg-[#D4AF37] hover:bg-amber-400 disabled:bg-[#334155] text-black disabled:text-[#94a3b8] font-bold font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-amber-300 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isVerifying ? (
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

                      <div className="flex justify-between items-center text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => setAuthMode("LOGIN")}
                          className="text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
                        >
                          &larr; Kembali ke Login
                        </button>
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={resendCooldown > 0 || isResending}
                          className="text-[#D4AF37] hover:underline disabled:text-[#8E8E93] flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
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
                    </div>
                  </form>
                )}

              </div>

            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* FLANKING MASCOT GUARDIANS (Prisha on Left Margin, Smaya on Right Margin) */}
      
      {/* Prisha Left Guardian */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="fixed left-6 sm:left-12 bottom-8 z-30 hidden lg:flex flex-col items-center pointer-events-none group opacity-80 hover:opacity-100 transition-opacity"
      >
        <div className="w-40 sm:w-48 h-52 sm:h-60 relative">
          <Image
            src="/prisha2.png"
            alt="Prisha Mascot"
            width={200}
            height={200}
            className="w-full h-full object-contain filter drop-shadow-[0_12px_28px_rgba(212,175,55,0.35)]"
            priority
          />
        </div>
        <div className="mt-1 font-mono text-xs text-[#FAFAFA] font-bold tracking-widest">PRISHA</div>
        <div className="font-mono text-[9px] text-[#D4AF37] tracking-[0.2em] uppercase">PENDAMPING BERKAS</div>
      </motion.div>

      {/* Smaya Right Guardian */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="fixed right-6 sm:right-12 bottom-8 z-30 hidden lg:flex flex-col items-center pointer-events-none group opacity-80 hover:opacity-100 transition-opacity"
      >
        <div className="w-40 sm:w-48 h-52 sm:h-60 relative">
          <Image
            src="/smaya2.png"
            alt="Smaya Mascot"
            width={200}
            height={200}
            className="w-full h-full object-contain filter drop-shadow-[0_12px_28px_rgba(212,175,55,0.35)]"
            priority
          />
        </div>
        <div className="mt-1 font-mono text-xs text-[#FAFAFA] font-bold tracking-widest">SMAYA</div>
        <div className="font-mono text-[9px] text-[#D4AF37] tracking-[0.2em] uppercase">PENDAMPING ORIENTASI</div>
      </motion.div>

      {/* Mobile Mascot Row */}
      <div className="flex lg:hidden justify-center gap-12 py-4 z-20">
        <div className="flex flex-col items-center text-center">
          <Image src="/prisha2.png" alt="Prisha" width={90} height={90} className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]" />
          <span className="font-mono text-[10px] text-[#D4AF37] tracking-widest mt-1">PRISHA</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <Image src="/smaya2.png" alt="Smaya" width={90} height={90} className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]" />
          <span className="font-mono text-[10px] text-[#D4AF37] tracking-widest mt-1">SMAYA</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-20 p-6 text-center font-mono text-[10px] text-[#8E8E93]/60 tracking-widest uppercase border-t border-[#D4AF37]/15">
        &copy; 2026 BEM FT UNESA &middot; KABINET DANADYAKSA &middot; SURABAYA
      </footer>

      {/* Cinematic Portal Opening Success Transition Overlay */}
      <AnimatePresence>
        {isPortalOpening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#040507] text-[#FAFAFA]"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center space-y-4 p-8"
            >
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center mx-auto text-[#D4AF37]">
                <CheckCircle2 className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                PORTAL DIBUKA
              </h2>
              <p className="text-sm font-mono text-[#D4AF37] tracking-widest">
                MENGHUBUNGKAN KE DASHBOARD MAHASISWA...
              </p>
            </motion.div>

            {/* Expanding Gold Curtain Light */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 2.5, opacity: 0.25 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute w-[600px] h-[600px] bg-[#D4AF37] rounded-full blur-[120px] pointer-events-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Transition Overlay to Home */}
      <AnimatePresence>
        {isNavigatingToHome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#040507]/95 backdrop-blur-xl text-[#FAFAFA] pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37]">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <span className="text-xs font-mono tracking-[0.3em] text-[#D4AF37] uppercase block">
                KEMBALI KE BERANDA...
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthContent />
    </Suspense>
  );
}
