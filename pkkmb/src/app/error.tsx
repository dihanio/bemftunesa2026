'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service securely in production
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0802] flex items-center justify-center p-4">
      <div className="bg-[#1a1405] border border-red-500/30 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-500/20 blur-[60px] rounded-full"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-4xl font-bold font-display text-white mb-2">Kesalahan Sistem</h1>
          <h2 className="text-lg font-bold text-red-400 mb-4">Gagal Memproses Permintaan</h2>
          
          <p className="text-white/60 mb-8 max-w-sm mx-auto text-sm">
            Terdapat gangguan pada server yang menyebabkan halaman tidak dapat dimuat. Tim teknis telah diberitahu mengenai kendala ini.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={() => reset()}
              className="inline-flex justify-center px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all"
            >
              Coba Lagi
            </button>
            <Link 
              href="/dashboard"
              className="inline-flex justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold transition-all shadow-lg shadow-red-900/50"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
