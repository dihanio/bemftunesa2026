import React from "react";
import { Search, CheckCircle } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface LetterFilterProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedType: string;
  setSelectedType: (val: string) => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
  dssMode: boolean;
  setDssMode: (val: boolean) => void;
}

export function LetterFilter({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  selectedStatus,
  setSelectedStatus,
  dssMode,
  setDssMode
}: LetterFilterProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 bg-surface-2 p-4 rounded-xl border border-hairline">
      <div className="flex-1 relative">
        <Search className="absolute left-3.5 top-3.5 text-ink-muted" size={16} />
        <input
          type="text"
          placeholder="Cari berdasarkan perihal, pengirim, atau penerima..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface-2 border border-hairline rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder-foreground/40 focus:outline-none focus:border-hairline focus:ring-1 focus:ring-sage"
        />
      </div>

      <div className="flex gap-4">
        <div className="w-36 relative z-20">
          <CustomSelect
            value={selectedType}
            onChange={setSelectedType}
            options={[
              { value: "", label: "Semua Jenis" },
              { value: "incoming", label: "Surat Masuk" },
              { value: "outgoing", label: "Surat Keluar" },
              { value: "proposal", label: "Proposal" },
              { value: "lpj", label: "LPJ" },
            ]}
            className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline"
          />
        </div>
        <div className="w-40 relative z-10">
          <CustomSelect
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { value: "", label: "Semua Status" },
              { value: "draft", label: "Draft" },
              { value: "review_kadep", label: "Review Kadep" },
              { value: "review_ketua", label: "Review Ketua" },
              { value: "approved", label: "Disetujui" },
              { value: "rejected", label: "Ditolak" },
            ]}
            className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline"
          />
        </div>
        
        <button
          onClick={() => setDssMode(!dssMode)}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            dssMode
              ? "bg-primary text-ink "
              : "bg-surface-2 border border-hairline text-ink hover:bg-surface-2"
          }`}
        >
          <CheckCircle size={16} />
          Rekomendasi Review
        </button>
      </div>
    </div>
  );
}
