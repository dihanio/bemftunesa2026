'use client';

import { Clock, Mail, Instagram, LogOut, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function PendingPage() {
  const handleLogout = () => {
    // Clear all cookies
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    window.location.href = '/login';
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-canvas p-6 animate-in fade-in duration-700">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 40px,
          #fff 40px,
          #fff 41px
        )`
      }} />

      <div className="relative w-full max-w-lg">
        {/* Main Card */}
        <div className="relative bg-surface-1 border border-hairline rounded-2xl p-8 lg:p-10 shadow-2xl">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-sage/20 rounded-2xl blur-xl opacity-30" />
          
          <div className="relative space-y-8">
            {/* Logo & Badge */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative w-16 h-16">
                <Image 
                  src="/images/logo-bemft.png" 
                  alt="BEM FT" 
                  fill 
                  className="object-contain" 
                />
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                Status: Pending
              </span>
            </div>

            {/* Title & Description */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
                Menunggu Persetujuan
              </h1>
              <p className="text-ink-muted text-sm lg:text-base leading-relaxed max-w-md mx-auto">
                Akun Google SSO Anda telah berhasil terdaftar ke sistem IMS. 
                Akses akan diberikan setelah Super Admin menyetujui dan menetapkan role Anda.
              </p>
            </div>

            {/* Status Timeline */}
            <div className="bg-surface-2 border border-hairline rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-sm text-ink-muted uppercase tracking-wider">
                Proses Verifikasi
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sage shrink-0 mt-0.5" />
                  <div>
                    <p className="text-ink text-sm font-medium">Registrasi Berhasil</p>
                    <p className="text-ink-subtle text-xs mt-0.5">Akun Anda telah tercatat dalam sistem</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  </div>
                  <div>
                    <p className="text-ink text-sm font-medium">Menunggu Approval Admin</p>
                    <p className="text-ink-subtle text-xs mt-0.5">1-2 hari kerja</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-hairline shrink-0 mt-0.5" />
                  <div>
                    <p className="text-ink-subtle text-sm font-medium">Akses Diberikan</p>
                    <p className="text-ink-subtle text-xs mt-0.5">Notifikasi via email</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="bg-surface-2 border border-hairline rounded-xl p-6 space-y-4">
              <p className="text-xs text-ink-muted text-center font-medium uppercase tracking-wider">
                Butuh Bantuan?
              </p>
              <div className="flex items-center justify-center gap-4">
                <a
                  href="mailto:admin@bemftunesa.com"
                  className="flex items-center gap-2 px-4 py-2 bg-surface-3 hover:bg-surface-4 border border-hairline rounded-lg text-ink-muted hover:text-ink text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
                <a
                  href="https://instagram.com/bemftunesa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-surface-3 hover:bg-surface-4 border border-hairline rounded-lg text-ink-muted hover:text-ink text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </a>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-surface-2 hover:bg-surface-3 border border-hairline rounded-xl text-ink font-medium text-sm transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
              Logout
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-ink-subtle mt-6 font-medium uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Kabinet Danadyaksa
        </p>
      </div>
    </main>
  );
}
