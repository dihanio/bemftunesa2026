import { ShieldAlert } from "lucide-react";

export default function KomdisPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Catatan Tata Tertib</h1>
          <p className="text-white/50 text-sm mt-1">Panel khusus Komisi Disiplin (Komdis) untuk mencatat indisipliner mahasiswa.</p>
        </div>
        
        <button className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
          <ShieldAlert className="w-4 h-4" />
          Lapor Insiden Baru
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
        <div className="flex flex-col max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Tidak Ada Data Pelanggaran Aktif</h3>
          <p className="text-white/50 text-sm">
            Saat ini tidak ada laporan pelanggaran tata tertib yang tercatat di sistem. Terus awasi ketertiban!
          </p>
        </div>
      </div>
    </div>
  );
}
