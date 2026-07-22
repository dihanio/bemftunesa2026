"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { AlertCircle, ChevronRight, ChevronDown, Shield } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authenticated = searchParams.get("authenticated");
  const errorType = searchParams.get("error");

  // Helper function to read cookies
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  // Helper function to delete cookies
  const deleteCookie = (name: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };

  // Debug: Log all query params and cookies on mount
  useEffect(() => {
    console.log('[LOGIN DEBUG] Component mounted');
    console.log('[LOGIN DEBUG] authenticated:', authenticated);
    console.log('[LOGIN DEBUG] errorType:', errorType);
    console.log('[LOGIN DEBUG] Full URL:', window.location.href);
    console.log('[LOGIN DEBUG] All cookies:', document.cookie);
    
    // Check for pending_redirect cookie
    const pendingRedirect = getCookie('pending_redirect');
    console.log('[LOGIN DEBUG] pending_redirect cookie:', pendingRedirect);
    
    if (pendingRedirect === 'true') {
      console.log('[LOGIN] Detected pending_redirect cookie, redirecting to /pending');
      deleteCookie('pending_redirect'); // Clear cookie before redirect
      window.location.href = "/pending";
    }
  }, []);

  useEffect(() => {
    console.log('[LOGIN DEBUG] authenticated useEffect triggered, value:', authenticated);
    if (authenticated === "true") {
      console.log('[LOGIN] Redirecting to dashboard...');
      window.location.href = "/";
    }
  }, [authenticated, router]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  // If we are currently authenticating
  if (authenticated === "true") {
    return (
      <div className="flex flex-col items-center justify-center gap-8 text-center mt-8 lg:mt-0">
        {/* Visual glowing scanner indicator */}
        <div className="relative w-24 h-24 flex items-center justify-center bg-primary/10 border border-hairline rounded-xl animate-pulse">
          <Shield className="w-12 h-12 text-primary" />
          <span className="absolute inset-0 rounded-xl border border-hairline animate-ping opacity-75" />
        </div>

        <div className="flex flex-col gap-3">
          <span className="font-mono text-[11px] text-primary tracking-[0.25em] uppercase font-bold">
            SYS_SECURE: AUTHENTICATING
          </span>
          <h1 className="text-ink font-extrabold text-2xl tracking-tight">
            Menghubungkan Akun Google SSO...
          </h1>
          <p className="text-xs text-ink-muted font-mono tracking-wider uppercase mt-2">
            Harap tunggu, meresolusi sertifikat JWT token
          </p>
        </div>
      </div>
    );
  }

  // Otherwise show the normal login form
  return (
    <div className="w-full max-w-[440px] space-y-6">
      {/* Mobile Header (Only visible on small screens) */}
      <div className="flex flex-col items-center text-center mb-10 lg:hidden">
        <Image 
          src="/images/logo-bemft.png" 
          alt="BEM FT" 
          width={56} 
          height={56} 
          className="object-contain mb-4 rounded-2xl" 
        />
        <span className="text-[10px] font-bold text-primary tracking-widest uppercase mb-2">
          BEM FT UNESA 2026
        </span>
        <h1 className="text-ink font-extrabold text-3xl tracking-tight leading-tight mb-2">
          IMS <span className="text-primary">Portal</span>
        </h1>
      </div>

      {/* Header */}
      <div className="text-center space-y-3">
        <h3 className="text-4xl font-extrabold text-ink tracking-tight">Masuk</h3>
        <p className="text-sm text-ink-muted leading-relaxed">
          Portal Administratif Kabinet Danadyaksa
        </p>
      </div>

      {/* Error Banners */}
      {errorType && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-500" />
          <div className="flex flex-col gap-1">
            {errorType === "pending" ? (
              <>
                <p className="font-bold text-rose-800">Akses Pendaftaran Dikirim</p>
                <p className="text-xs text-rose-700/80 leading-relaxed">
                  Akun Google Anda telah didaftarkan ke sistem. Hubungi Super Admin BEM FT untuk menyetujui akses masuk Anda.
                </p>
              </>
            ) : errorType === "deactivated" ? (
              <>
                <p className="font-bold text-rose-800">Akun Dinonaktifkan</p>
                <p className="text-xs text-rose-700/80 leading-relaxed">
                  Akun Anda telah dinonaktifkan oleh administrator. Silakan hubungi admin untuk aktivasi kembali.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-rose-800">Akses Ditolak</p>
                <p className="text-xs text-rose-700/80 leading-relaxed">
                  Gagal melakukan otentikasi via Google SSO. Harap coba lagi atau hubungi administrator.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Login Card */}
      <div className="bg-surface-1 border border-hairline rounded-xl p-6 space-y-5">
        
        {/* Google SSO Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-lg bg-primary hover:bg-primary/90 font-semibold text-sm text-white transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-primary/20"
        >
          <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Lanjutkan dengan Google</span>
        </button>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-hairline"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-surface-1 text-xs text-ink-subtle">Google Workspace UNESA</span>
          </div>
        </div>

        {/* Info Text */}
        <p className="text-xs text-center text-ink-subtle leading-relaxed">
          Masuk dengan akun Google organisasi UNESA
        </p>

      </div>

      {/* Footer */}
      <p className="text-[10px] text-center text-ink-subtle uppercase tracking-widest">
        &copy; {new Date().getFullYear()} Kabinet Danadyaksa
      </p>
    </div>
  );
}

export default function LoginPage() {

  return (
    <main className="min-h-screen w-full flex bg-canvas animate-in fade-in duration-700 p-0 lg:p-6 gap-0 lg:gap-6">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden text-white rounded-2xl">
        
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0 rounded-2xl overflow-hidden" style={{position: 'absolute', height: '100%'}}>
          <Image 
            src="/images/gedung-ft.png" 
            alt="Gedung Fakultas Teknik" 
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#091c11]/90 via-[#091c11]/70 to-[#091c11]/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden" style={{position: 'relative', height: '32px'}}>
              <Image 
                src="/images/logo-bemft.png" 
                alt="Logo BEM FT UNESA" 
                fill 
                sizes="32px"
                className="object-contain"
                priority
              />
            </div>
            <Image 
              src="/images/logo-kabinet.png" 
              alt="Kabinet" 
              width={32} 
              height={32} 
              className="object-contain rounded-full" 
              priority
            />
          </div>
          <div className="h-6 w-[1px] bg-white/20" />
          <span className="text-xs font-bold tracking-widest uppercase text-white/90">BEM FT UNESA</span>
        </div>

        <div className="relative z-10 max-w-lg mt-auto mb-auto">
          <h2 className="text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
            Integrated<br />
            <span className="text-primary">Management</span><br />
            System.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-md">
            Portal administratif eksklusif fungsionaris. Kelola persuratan, keuangan, dan program kerja dalam satu ruang kerja cerdas.
          </p>
        </div>
        
        <div className="relative z-10 text-xs font-bold text-white/50 uppercase tracking-widest">
          Kabinet Danadyaksa &copy; {new Date().getFullYear()}
        </div>
      </div>

      {/* Right Side - Login Forms */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12 relative bg-canvas lg:rounded-2xl lg:border lg:border-hairline">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center gap-6 text-center mt-8 lg:mt-0">
            <div className="w-16 h-16 border-4 border-hairline border-t-sage rounded-full animate-spin" />
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
              Memuat modul autentikasi...
            </span>
          </div>
        }>
          <LoginContent />
        </Suspense>
      </div>
    </main>
  );
}
