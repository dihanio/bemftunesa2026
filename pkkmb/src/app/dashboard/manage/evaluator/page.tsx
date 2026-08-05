"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, CheckCircle2, Clock, Search, X, Check } from "lucide-react";

interface Submission {
  _id: string;
  userId: { _id: string; name: string; nim: string; pkkmbGroup?: string };
  taskId: { _id: string; title: string; type: string };
  fileUrl?: string;
  textContent?: string;
  status: string;
  score?: number;
  feedback?: string;
  createdAt: string;
}

export default function EvaluatorPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, graded: 0, total: 0 });
  const [search, setSearch] = useState("");
  
  const [selectedItem, setSelectedItem] = useState<Submission | null>(null);
  const [score, setScore] = useState<number | "">("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:4000/api/v1/pkkmb/pemateri/submissions", {
        credentials: "include"
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSubmissions(json.data);

          const pending = (json.data as Submission[]).filter((s) => s.status === 'SUBMITTED').length;
          const graded = (json.data as Submission[]).filter((s) => s.status === 'GRADED').length;
          setStats({ pending, graded, total: json.data.length });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleGrade = async () => {
    if (!selectedItem || score === "") return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:4000/api/v1/pkkmb/pemateri/submissions/${selectedItem._id}/grade`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ score: Number(score), feedback })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedItem(null);
        fetchSubmissions();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = submissions.filter(s => 
    s.userId?.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.userId?.nim?.includes(search) || 
    s.taskId?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Evaluasi Penugasan</h1>
        <p className="text-white/50 text-sm mt-1">Periksa dan berikan nilai pada tugas harian mahasiswa baru.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <Clock className="w-5 h-5" />
            <h3 className="font-bold">Menunggu Evaluasi</h3>
          </div>
          <p className="text-3xl font-display font-bold text-white">{stats.pending}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-green-400 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold">Sudah Dinilai</h3>
          </div>
          <p className="text-3xl font-display font-bold text-white">{stats.graded}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-white/50 mb-2">
            <FileText className="w-5 h-5" />
            <h3 className="font-bold">Total Tugas (Hari Ini)</h3>
          </div>
          <p className="text-3xl font-display font-bold text-white">{stats.total}</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-xl font-bold text-white">Daftar Pengumpulan</h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Cari nama, NIM, tugas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-gold-500/50"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">Antrean Kosong / Tidak ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-white/50 uppercase border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-medium">Mahasiswa</th>
                  <th className="px-4 py-3 font-medium">Tugas</th>
                  <th className="px-4 py-3 font-medium">Waktu Kirim</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-4">
                      <div className="font-bold text-white">{item.userId?.name}</div>
                      <div className="text-white/50">{item.userId?.nim}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white">{item.taskId?.title}</div>
                      <div className="text-xs text-white/40 uppercase">{item.taskId?.type}</div>
                    </td>
                    <td className="px-4 py-4 text-white/70">
                      {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-4">
                      {item.status === 'GRADED' ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30">Dinilai ({item.score})</span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/30">Menunggu</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button 
                        onClick={() => { setSelectedItem(item); setScore(item.score || ""); setFeedback(item.feedback || ""); }}
                        className="px-3 py-1.5 bg-gold-500/10 text-gold-500 hover:bg-gold-500/20 rounded-lg transition-colors font-semibold"
                      >
                        Nilai
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grade Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1405] border border-gold-500/30 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Evaluasi Tugas</h3>
              <button onClick={() => setSelectedItem(null)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-white/50 uppercase mb-1">Maba</div>
                <div className="font-bold text-white text-lg">{selectedItem.userId?.name}</div>
                <div className="text-white/70">{selectedItem.userId?.nim}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs text-white/50 uppercase">Tugas</div>
                <div className="font-bold text-white">{selectedItem.taskId?.title}</div>
                
                <div className="mt-4">
                  {selectedItem.fileUrl ? (
                    <a href={`http://localhost:4000${selectedItem.fileUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors text-sm font-bold border border-blue-500/30">
                      <FileText className="w-4 h-4" />
                      Lihat File Tugas
                    </a>
                  ) : selectedItem.textContent ? (
                    <div className="p-4 bg-black/50 border border-white/10 rounded-xl text-white/80 whitespace-pre-wrap text-sm">
                      {selectedItem.textContent}
                    </div>
                  ) : (
                    <div className="text-white/50 italic text-sm">Tidak ada file/teks</div>
                  )}
                </div>
              </div>

              <hr className="border-white/10" />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Nilai (0-100)</label>
                  <input 
                    type="number" 
                    min="0" max="100"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold-500/50"
                    placeholder="Masukkan nilai..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Feedback (Opsional)</label>
                  <textarea 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold-500/50 min-h-[100px]"
                    placeholder="Tuliskan masukan untuk tugas ini..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2.5 rounded-xl text-white/70 hover:bg-white/10 font-semibold transition-colors text-sm"
              >
                Batal
              </button>
              <button 
                onClick={handleGrade}
                disabled={isSubmitting || score === ""}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-white font-bold text-sm disabled:opacity-50 transition-all shadow-lg shadow-gold-500/20"
              >
                {isSubmitting ? "Menyimpan..." : <><Check className="w-4 h-4" /> Simpan Nilai</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
