"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import apiClient from "@bemft/api-client";
import { useAuth } from "@/hooks/useAuth";
import { listPermissionsForRoles } from "@bemft/permissions";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [bypassCount, setBypassCount] = useState(0);
  const { login } = useAuth();

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const authResponse = await apiClient.post<any>("/auth/google", {
        token: tokenResponse.credential || tokenResponse.access_token,
      });

      const { accessToken, refreshToken, user } = authResponse.data;
      login(user, accessToken, refreshToken);
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message ||
          "Gagal masuk. Pastikan Anda menggunakan email universitas.",
      );
      setIsLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      setErrorMsg(
        "Google SSO gagal. Kredensial tidak valid atau Client ID belum diatur.",
      );
      setIsLoading(false);
    },
    onNonOAuthError: (error) => {
      // Dijalankan jika user menutup popup (popup_closed) atau error non-auth lainnya
      setIsLoading(false);
      if (error.type !== "popup_closed") {
        setErrorMsg("Autentikasi dibatalkan atau terjadi kesalahan jaringan.");
      }
    },
    flow: "implicit",
  });

  const handleLogoClick = () => {
    if (process.env.NODE_ENV === "development") {
      const newCount = bypassCount + 1;
      setBypassCount(newCount);
      if (newCount >= 5) {
        setIsLoading(true);
        setTimeout(() => {
          login(
            {
              id: "dev-bypass-admin-id",
              email: "admin@mhs.unesa.ac.id",
              name: "Developer Bypass",
              role: "Super Admin",
              roles: ["Super Admin"],
              permissions: listPermissionsForRoles(["Super Admin"]),
              avatar: "https://github.com/shadcn.png",
            },
            "fake-bypass-jwt-token-123456",
          );

          // Menggunakan window.location agar state benar-benar tersimpan
          window.location.href = "/";
        }, 800);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full bg-[#12331e] relative overflow-hidden font-sans">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/ft_unesa.webp"
          alt="Latar Belakang FT"
          fill
          className="object-cover opacity-10"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-[#12331e]/80 via-[#12331e]/95 to-[#091c11] z-10" />
      </div>

      {/* Ambient Glowing Orbs */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
        <div
          className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[#10b981] blur-[150px] animate-pulse"
          style={{ animationDuration: "6s" }}
        />
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[#3d5229] blur-[150px]" />
      </div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-size-[32px_32px] pointer-events-none z-0" />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-lg px-6"
      >
        <div className="backdrop-blur-2xl bg-white/3 border border-white/10 p-10 md:p-12 rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col items-center">
          {/* Header Logos */}
          <div
            className="flex items-center gap-4 mb-8 cursor-pointer group"
            onClick={handleLogoClick}
          >
            <div className="relative flex items-center justify-center w-16 h-16 transition-all duration-500 group-hover:scale-110 shrink-0">
              <Image
                src="/logobemft.png"
                alt="Logo BEM FT"
                width={64}
                height={64}
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
            <div className="relative flex items-center justify-center w-16 h-16 transition-all duration-500 group-hover:scale-110 shrink-0">
              <Image
                src="/logo-kabinet.png"
                alt="Logo Kabinet"
                width={76}
                height={76}
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          <div className="text-center mb-10">
            <span className="text-[10px] font-mono text-[#10b981] uppercase tracking-[0.3em] mb-3 block">
              Internal Management System
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
              AEC Danadyaksa
            </h1>
            <p className="text-sm text-gray-400">
              Gunakan email universitas untuk mengakses portal terintegrasi.
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="w-full mb-6 overflow-hidden"
              >
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Button */}
          <button
            onClick={() => {
              setIsLoading(true);
              loginWithGoogle();
            }}
            disabled={isLoading}
            className="w-full h-14 relative flex items-center justify-center gap-4 bg-white text-[#1a2214] font-bold rounded-2xl hover:bg-[#10b981] hover:text-white transition-all duration-300 group overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(16, 185, 129,0.4)]"
          >
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg
                className="w-5 h-5 bg-white rounded-full p-0.5 shadow-sm group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span className="relative z-10 text-sm tracking-wide">
              {isLoading
                ? "Memvalidasi Identitas..."
                : "Masuk dengan SSO Kampus"}
            </span>
          </button>

          <div className="w-full flex items-center justify-between mt-8 pt-6 border-t border-white/5 opacity-50">
            <span className="text-[9px] font-mono text-white tracking-widest uppercase">
              Secured by PTI
            </span>
            <span className="text-[9px] font-mono text-white tracking-widest uppercase">
              v2.0.0
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
