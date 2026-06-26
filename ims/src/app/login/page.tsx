"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { AlertCircle, ChevronRight, ChevronDown, Shield } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

function LoginContent() {
  const [showBypass, setShowBypass] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      // Save token in localStorage
      localStorage.setItem("ims_token", token);
      
      // Brief delay to ensure storage write completes
      const timer = setTimeout(() => {
        window.location.href = "/";
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [token, router]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleBypassLogin = (email: string) => {
    window.location.href = `${API_BASE_URL}/auth/bypass?email=${encodeURIComponent(email)}`;
  };

  const bypassUsers = [
    { name: "Super Admin", role: "Super Admin", email: "youremail@gmail.com", accent: "border-purple-500/30 hover:bg-purple-500/5" },
    { name: "Achmad Yusuf", role: "Ketua BEM", email: "yusuf@mhs.unesa.ac.id", accent: "border-accent-gold/30 hover:bg-accent-gold/5" },
    { name: "Safira Rahma", role: "Sekretaris", email: "safira@mhs.unesa.ac.id", accent: "border-sage/30 hover:bg-sage/5" },
    { name: "Farhan Syah", role: "Bendahara", email: "farhan@mhs.unesa.ac.id", accent: "border-sage/30 hover:bg-sage/5" },
    { name: "Rizky Dwi", role: "Kadep Kominfo", email: "rizky@mhs.unesa.ac.id", accent: "border-accent-blue/30 hover:bg-accent-blue/5" },
    { name: "Agus Setiawan", role: "Staf PSDM", email: "agus@mhs.unesa.ac.id", accent: "border-foreground/10 hover:bg-foreground/5" },
  ];

  // If we have a token, we are currently authenticating
  if (token) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 text-center mt-8 lg:mt-0">
        {/* Visual glowing scanner indicator */}
        <div className="relative w-24 h-24 flex items-center justify-center bg-sage/10 border border-sage/20 rounded-3xl animate-pulse">
          <Shield className="w-12 h-12 text-sage" />
          <span className="absolute inset-0 rounded-3xl border border-sage/40 animate-ping opacity-75" />
        </div>

        <div className="flex flex-col gap-3">
          <span className="font-mono text-[11px] text-sage tracking-[0.25em] uppercase font-bold">
            SYS_SECURE: AUTHENTICATING
          </span>
          <h1 className="text-foreground font-extrabold text-2xl tracking-tight">
            Menghubungkan Akun Google SSO...
          </h1>
          <p className="text-xs text-foreground/50 font-mono tracking-wider uppercase mt-2">
            Harap tunggu, meresolusi sertifikat JWT token
          </p>
        </div>
      </div>
    );
  }

  // Otherwise show the normal login form
  return (
    <div className="w-full max-w-[400px]">
      {/* Mobile Header (Only visible on small screens) */}
      <div className="flex flex-col items-center text-center mb-10 lg:hidden">
        <Image 
          src="/images/logo-bemft.png" 
          alt="BEM FT" 
          width={56} 
          height={56} 
          className="object-contain drop-shadow-md mb-4" 
        />
        <span className="text-[10px] font-bold text-sage tracking-widest uppercase mb-2">
          BEM FT UNESA 2026
        </span>
        <h1 className="text-foreground font-extrabold text-3xl tracking-tight leading-tight mb-2">
          IMS <span className="text-sage">Portal</span>
        </h1>
      </div>

      <div className="mb-8 hidden lg:block text-center">
        <h3 className="text-3xl font-extrabold text-foreground mb-2">Masuk</h3>
        <p className="text-sm text-foreground/50 font-medium">Gunakan kredensial SSO UNESA Anda</p>
      </div>

      {/* Login Card */}
      <div className="bg-transparent mb-6">
        <div className="flex flex-col gap-4">
          
          {/* Google SSO Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-sage hover:bg-foliage font-bold text-sm text-background transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <svg className="w-5 h-5 fill-current shrink-0 relative z-10" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="relative z-10">Lanjutkan dengan Google</span>
          </button>
        </div>
      </div>

      {/* Clean footer */}
      <div className="mt-8 text-center lg:hidden">
        <p className="text-[10px] font-semibold text-foreground/30 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Kabinet Danadyaksa
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {

  return (
    <main className="min-h-screen w-full flex bg-background animate-in fade-in duration-700">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden text-white">
        
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
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
            <div className="relative w-8 h-8">
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
              className="object-contain" 
              priority
            />
          </div>
          <div className="h-6 w-[1px] bg-white/20" />
          <span className="text-xs font-bold tracking-widest uppercase text-white/90 drop-shadow-md">BEM FT UNESA</span>
        </div>

        <div className="relative z-10 max-w-lg mt-auto mb-auto">
          <h2 className="text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight drop-shadow-lg">
            Integrated<br />
            <span className="text-sage drop-shadow-md">Management</span><br />
            System.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-md drop-shadow-md">
            Portal administratif eksklusif fungsionaris. Kelola persuratan, keuangan, dan program kerja dalam satu ruang kerja cerdas.
          </p>
        </div>
        
        <div className="relative z-10 text-xs font-bold text-white/50 uppercase tracking-widest">
          Kabinet Danadyaksa &copy; {new Date().getFullYear()}
        </div>
      </div>

      {/* Right Side - Login Forms */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12 relative bg-background border-l border-sage/10 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.02)]">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center gap-6 text-center mt-8 lg:mt-0">
            <div className="w-16 h-16 border-4 border-sage/20 border-t-sage rounded-full animate-spin" />
            <span className="font-mono text-[10px] text-foreground/40 uppercase tracking-widest">
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
