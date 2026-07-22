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
      <div className="flex flex-col items-center justify-center gap-4 text-center mt-8">
        <Loader2 className="w-5 h-5 text-ink-muted animate-spin" />
        <p className="text-sm text-ink-muted">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[360px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="flex items-center gap-3">
          <Image 
            src="/images/logo-bemft.png" 
            alt="BEM FT" 
            width={32} 
            height={32} 
            className="object-contain" 
          />
          <Image 
            src="/images/logo-kabinet.png" 
            alt="Kabinet" 
            width={32} 
            height={32} 
            className="object-contain" 
          />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-ink tracking-tight">
            Log in to IMS
          </h1>
          <p className="text-sm text-ink-muted">
            Internal Management System Kabinet Danadyaksa
          </p>
        </div>
      </div>

      {/* Error Banners */}
      {errorType && (
        <div className="flex items-start gap-3 p-3 rounded-md border border-rose-500/20 bg-rose-500/10 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-500" />
          <div className="flex flex-col gap-1">
            {errorType === "pending" ? (
              <p className="text-rose-200">Akses Pendaftaran Dikirim. Menunggu persetujuan admin.</p>
            ) : errorType === "deactivated" ? (
              <p className="text-rose-200">Akun Anda dinonaktifkan.</p>
            ) : (
              <p className="text-rose-200">Akses ditolak. Coba lagi atau hubungi admin.</p>
            )}
          </div>
        </div>
      )}

      {/* Action */}
      <div className="space-y-4">
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-md bg-[#ffffff] hover:bg-gray-100 text-[#000000] font-medium text-sm transition-colors border border-transparent"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="text-xs text-center text-ink-subtle">
          Gunakan akun Google Workspace UNESA
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-canvas p-6">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="w-5 h-5 text-ink-muted animate-spin" />
          <p className="text-sm text-ink-muted">Loading...</p>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </main>
  );
}
