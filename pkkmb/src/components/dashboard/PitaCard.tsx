"use client";

import { RIBBON_META, type MabaRibbon } from "@/lib/maba";

// Kartu pita NON-SENSITIF: hanya menampilkan warna pita + instruksi umum.
// Diagnosis/kondisi medis TIDAK pernah ditampilkan di sini — detail hanya
// untuk tim medis yang berwenang.
export default function PitaCard({ ribbon }: { ribbon: MabaRibbon }) {
  if (!ribbon) return null;
  const meta = RIBBON_META[ribbon];
  if (!meta) return null;

  return (
    <section
      className={`rounded-2xl border ${meta.border} bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 flex items-start gap-3`}
    >
      <div
        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.chip}`}
        aria-hidden="true"
      >
        <span className={`w-4 h-4 rounded-full ${meta.dot}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
          {meta.label}
          <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border font-semibold bg-black/30 border-white/10 text-white/60">
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            Gunakan selama kegiatan
          </span>
        </p>
        <p className="text-xs text-white/60 mt-1 leading-relaxed">
          Kenakan {meta.label.toLowerCase()} selama rangkaian PKKMB agar
          panitia & tim medis mudah mengenali kamu.
        </p>
        <p className="text-[10px] text-white/35 mt-1.5">
          Info ini hanya untuk kamu — tim medis sudah mengetahuinya.
        </p>
      </div>
    </section>
  );
}
