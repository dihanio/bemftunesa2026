"use client";

import React, { useEffect, Suspense } from "react";
import Image from "next/image";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authenticated = searchParams.get("authenticated");
  const errorType = searchParams.get("error");

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const deleteCookie = (name: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };

  useEffect(() => {
    const pendingRedirect = getCookie('pending_redirect');
    if (pendingRedirect === 'true') {
      deleteCookie('pending_redirect');
      window.location.href = "/pending";
    }
  }, []);

  useEffect(() => {
    if (authenticated === "true") {
      window.location.href = "/";
    }
  }, [authenticated, router]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  if (authenticated === "true") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <h3 className="text-xl font-semibold text-ink">Mengautentikasi...</h3>
        <p className="text-sm text-ink-muted">Harap tunggu sesaat.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] space-y-8">
      {/* Mobile Branding */}
      <div className="flex flex-col items-center text-center lg:hidden mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Image 
            src="/images/logo-bemft.png" 
            alt="BEM FT" 
            width={64} 
            height={64} 
            className="object-contain" 
          />
          <Image 
            src="/images/logo-kabinet.png" 
            alt="Kabinet" 
            width={64} 
            height={64} 
            className="object-contain" 
          />
        </div>
        <h1 className="text-3xl font-extrabold text-ink tracking-tight">IMS Portal</h1>
      </div>

      <div className="text-center lg:text-left space-y-2">
        <h2 className="text-3xl font-bold text-ink tracking-tight">Masuk</h2>
        <p className="text-ink-muted">Gunakan kredensial SSO UNESA Anda</p>
      </div>

      {errorType && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-rose-500/20 bg-rose-500/10 text-sm">
          <AlertCircle size={18} className="shrink-0 text-rose-500 mt-0.5" />
          <div className="flex flex-col gap-1 text-rose-600">
            {errorType === "pending" ? (
              <p>Pendaftaran berhasil dikirim. Menunggu persetujuan admin.</p>
            ) : errorType === "deactivated" ? (
              <p>Akun Anda telah dinonaktifkan.</p>
            ) : (
              <p>Gagal masuk. Pastikan menggunakan email UNESA.</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-ink hover:bg-ink-muted text-canvas font-medium transition-all"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Lanjutkan dengan Google
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex bg-canvas">
      {/* Left Side - Branding Image (Visible on Desktop) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden text-white">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/gedung-ft.png" 
            alt="Gedung Fakultas Teknik" 
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />
          {/* Subtle elegant gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-transparent" />
        </div>
        
        {/* Top Left Logos */}
        <div className="relative z-10 flex items-center gap-6">
          <div className="flex items-center gap-4 bg-black/20 p-3 pr-6 rounded-full backdrop-blur-md border border-white/10 shadow-xl">
            <Image 
              src="/images/logo-bemft.png" 
              alt="BEM FT" 
              width={56} 
              height={56} 
              className="object-contain" 
            />
            <Image 
              src="/images/logo-kabinet.png" 
              alt="Kabinet" 
              width={56} 
              height={56} 
              className="object-contain" 
            />
            <div className="w-[1px] h-8 bg-white/20 mx-2" />
            <span className="font-semibold tracking-wide text-sm text-white/90">BEM FT UNESA</span>
          </div>
        </div>

        {/* Bottom Left Text */}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold tracking-tight mb-4 text-white">
            Integrated<br />
            Management<br />
            System.
          </h1>
          <p className="text-white/80 max-w-md text-lg leading-relaxed">
            Portal administratif eksklusif fungsionaris. Kelola persuratan, keuangan, dan program kerja dalam satu ruang kerja cerdas.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-ink-muted animate-spin" />
          </div>
        }>
          <LoginContent />
        </Suspense>
      </div>
    </main>
  );
}
