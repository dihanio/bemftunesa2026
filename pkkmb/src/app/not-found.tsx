import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0802] flex items-center justify-center p-4">
      <div className="bg-[#1a1405] border border-gold-500/30 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gold-500/20 blur-[60px] rounded-full"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-6xl font-bold font-display text-white mb-2">404</h1>
          <h2 className="text-xl font-bold text-gold-400 mb-4">Halaman Tidak Ditemukan</h2>
          
          <p className="text-white/60 mb-8 max-w-sm mx-auto">
            Maaf, halaman yang Anda cari tidak ada atau mungkin sudah dipindahkan.
          </p>
          
          <Link 
            href="/dashboard"
            className="inline-flex px-8 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-white font-bold transition-all shadow-lg shadow-gold-900/50"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
