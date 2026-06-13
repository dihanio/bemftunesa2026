import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative overflow-hidden bg-white dark:bg-slate-950">
      {/* Background Decor */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <div className="w-[500px] h-[500px] bg-blue-600 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4"></div>
        <div className="w-[400px] h-[400px] bg-emerald-500 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4"></div>
      </div>

      <div className="relative z-10 text-center px-6">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <Compass className="w-24 h-24 text-blue-600 dark:text-blue-500 animate-[spin_4s_linear_infinite]" strokeWidth={1.5} />
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent rounded-full blur-xl"></div>
          </div>
        </div>
        
        <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 tracking-tighter mb-4">
          404
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Halaman Tidak Ditemukan
        </h2>
        
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-10 text-lg leading-relaxed">
          Sepertinya Anda tersesat terlalu jauh dari Fakultas Teknik. Halaman yang Anda cari mungkin telah dipindahkan atau tidak pernah ada.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 bg-blue-600 border border-transparent rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Link>
          
          <Link
            href="/kontak"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-300 transition-all duration-200 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200"
          >
            Hubungi Kami
          </Link>
        </div>
      </div>
    </div>
  );
}
