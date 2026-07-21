"use client";

export const dynamic = 'force-dynamic';

import { FileUp, Trash2 } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { CustomSelect } from "@/components/ui/CustomSelect";
import ImsApiService from "@/lib/api";
import { Users, Search, Plus, Loader2, Upload, AlertCircle, RefreshCw, KeyRound } from "lucide-react";
import React, { useState, useEffect } from "react";

interface MabaItem {
  _id: string;
  nim: string;
  name: string;
  prodi?: string;
  kelompok: string;
}

export default function PkkmbMabaPage() {
  const [mabaList, setMabaList] = useState<MabaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedKelompok, setSelectedKelompok] = useState("");
  const [selectedProdi, setSelectedProdi] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);

  // Seed Modal State
  const [seedModalOpen, setSeedModalOpen] = useState(false);
  const [seedJson, setSeedJson] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await ImsApiService.getMabaList<MabaItem>();
      if (res.success && res.data) {
        setMabaList(res.data);
      }
    } catch (err) {
      console.error("Failed to load maba list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!seedJson.trim()) {
      setErrorMsg("Konten data JSON wajib diisi");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(seedJson);
      if (!Array.isArray(parsed)) {
        throw new Error("Format JSON harus berupa Array objek mahasiswa");
      }
      for (const item of parsed) {
        if (!item.nim || !item.name || !item.prodi || !item.kelompok) {
          throw new Error("Tiap data harus memiliki properti nim, name, prodi, dan kelompok");
        }
      }
    } catch (err: unknown) {
      setErrorMsg("JSON tidak valid: " + (err as Error).message);
      return;
    }

    try {
      setIsSeeding(true);
      const res = await ImsApiService.seedMaba(parsed);
      if (res.success) {
        setSuccessMsg(`Berhasil mengimpor ${res.data?.count || parsed.length} data mahasiswa baru!`);
        setSeedJson("");
        fetchData();
        setTimeout(() => setSeedModalOpen(false), 2000);
      } else {
        setErrorMsg(res.message || "Gagal mengimpor data");
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Gagal menghubungi server");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetPassword = async (mabaId: string, mabaName: string) => {
    if (!window.confirm(`Reset password untuk ${mabaName} kembali menjadi NIM?`)) return;
    
    try {
      setResettingId(mabaId);
      const res = await ImsApiService.resetMabaPassword(mabaId);
      if (res.success) {
        alert('Password berhasil di-reset ke NIM');
      } else {
        alert(res.message || 'Gagal reset password');
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Terjadi kesalahan saat reset password');
    } finally {
      setResettingId(null);
    }
  };

  // Get unique options for filters
  const kelompokOptions = Array.from(new Set(mabaList.map((m) => m.kelompok))).filter(Boolean);
  const prodiOptions = Array.from(new Set(mabaList.map((m) => m.prodi))).filter(Boolean);

  // Filter & Search
  const filteredList = mabaList.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.nim.toLowerCase().includes(search.toLowerCase());
    const matchesKelompok = !selectedKelompok || m.kelompok === selectedKelompok;
    const matchesProdi = !selectedProdi || m.prodi === selectedProdi;
    return matchesSearch && matchesKelompok && matchesProdi;
  });

  return (
    <DashboardShell requirePkkmbAccess>
      <div className="flex flex-col gap-6 p-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl flex items-center gap-2">
              <Users className="w-8 h-8 text-emerald-500" />
              <span>Data Mahasiswa Baru</span>
            </h1>
            <p className="text-sm text-ink-muted">
              Daftar seluruh mahasiswa baru Fakultas Teknik yang terdaftar dalam sistem PKKMB.
            </p>
          </div>

          <button
            onClick={() => setSeedModalOpen(true)}
            className="btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Import Data Maba</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Cari NIM atau Nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-2 border border-hairline rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>

          <CustomSelect
            value={selectedKelompok}
            onChange={setSelectedKelompok}
            options={[
              { value: "", label: "Semua Kelompok" },
              ...kelompokOptions.map(opt => ({ value: opt || "", label: opt || "" }))
            ]}
            placeholder="Semua Kelompok"
            className="bg-surface-2 border-hairline hover:bg-surface-3"
          />

          <CustomSelect
            value={selectedProdi}
            onChange={setSelectedProdi}
            options={[
              { value: "", label: "Semua Program Studi" },
              ...prodiOptions.map(opt => ({ value: opt || "", label: opt || "" }))
            ]}
            placeholder="Semua Program Studi"
            className="bg-surface-2 border-hairline hover:bg-surface-3"
          />
        </div>

        {/* Table list */}
        {loading ? (
          <div className="w-full py-16 flex flex-col items-center justify-center text-ink-muted">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-sm">Memuat data Maba...</p>
          </div>
        ) : (
          <div className="bg-surface-1 border border-hairline rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-hairline bg-surface-2 text-ink-muted font-bold">
                    <th className="px-6 py-4">NIM</th>
                    <th className="px-6 py-4">Nama Lengkap</th>
                    <th className="px-6 py-4">Program Studi</th>
                    <th className="px-6 py-4">Kelompok</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-ink-muted">
                        Mahasiswa tidak ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((maba) => (
                      <tr key={maba._id} className="hover:bg-surface-2 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-ink-muted">{maba.nim}</td>
                        <td className="px-6 py-4 font-extrabold text-ink">{maba.name}</td>
                        <td className="px-6 py-4 text-ink-muted">{maba.prodi}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500 border border-amber-500/20">
                            {maba.kelompok}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
                            Aktif
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleResetPassword(maba._id, maba.name)}
                            disabled={resettingId === maba._id}
                            className="inline-flex items-center justify-center rounded-lg bg-amber-500/10 p-2 text-amber-500 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                            title="Reset Password (ke NIM)"
                          >
                            {resettingId === maba._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <KeyRound className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* IMPORT SEED MODAL */}
      {seedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-surface-1 border border-hairline rounded-xl p-6 sm:p-8 space-y-6 relative">
            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold text-ink">Import Data Mahasiswa Baru</h3>
              <p className="text-xs text-ink-muted leading-normal">
                Tempel data JSON array Maba untuk dimasukkan ke database. Password bawaan akun Maba akan diset sesuai NIM mereka masing-masing.
              </p>
            </div>

            <form onSubmit={handleSeed} className="space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-500">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="field-label">
                  Data JSON Maba (Format Array)
                </label>
                <textarea
                  required
                  placeholder={`[\n  {\n    "nim": "26051204001",\n    "name": "Budi Santoso",\n    "prodi": "S1 Teknik Informatika",\n    "kelompok": "Kelompok 1 - Tesla"\n  }\n]`}
                  value={seedJson}
                  onChange={(e) => setSeedJson(e.target.value)}
                  rows={10}
                  className="input-field font-mono placeholder-foreground/30 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSeedModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSeeding}
                  className="btn-primary text-xs"
                >
                  {isSeeding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Import Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
