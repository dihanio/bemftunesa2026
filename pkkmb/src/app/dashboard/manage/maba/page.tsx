"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Wand2, Star, StarOff, Eye, Trash2, Award, Accessibility, Download } from "lucide-react";
import { API_URL, apiFetch } from "@/lib/api";

interface MabaData {
  _id: string;
  nim: string;
  name: string;
  email: string;
  avatar?: string;
  studyProgram: string;
  pkkmbGroup?: { _id: string; name: string; ketuaGugusId?: string };
  isOnboarded?: boolean;
  disability?: { isDisabled?: boolean; description?: string };
}

const AvatarImage = ({ src, name }: { src?: string; name: string }) => {
  const [error, setError] = useState(false);

  // Strict Frontend Validation
  const isValid = src && 
                  src.trim() !== '' && 
                  !src.includes('localhost') && 
                  !src.includes('dummy') &&
                  !src.startsWith('/uploads');

  if (!isValid || error) {
    return (
      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        <span className="text-white/50 text-sm font-bold">{name.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={name} 
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
      className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" 
    />
  );
};

export default function DataMabaPage() {
  const [data, setData] = useState<MabaData[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false
  });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [hasSettingsManage, setHasSettingsManage] = useState(false);
  const [isPendamping, setIsPendamping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGrouping, setIsGrouping] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [ketuaConfirmModal, setKetuaConfirmModal] = useState<{ show: boolean, mabaId: string, mabaName: string }>({ show: false, mabaId: '', mabaName: '' });
  const [unsetKetuaConfirmModal, setUnsetKetuaConfirmModal] = useState<{ show: boolean, mabaId: string, mabaName: string }>({ show: false, mabaId: '', mabaName: '' });
  const [resultModal, setResultModal] = useState<{ show: boolean, message: string, isError: boolean }>({ show: false, message: '', isError: false });
  const [deleteModal, setDeleteModal] = useState<{ show: boolean, id: string, name: string }>({ show: false, id: '', name: '' });
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [selectedMaba, setSelectedMaba] = useState<MabaData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchData = async (currentPage = pagination.page, searchQuery = search, sort = sortBy, order = sortOrder, currentLimit = pagination.limit) => {
    try {
      setIsLoading(true);
      const [res, authRes] = await Promise.all([
        apiFetch(`/pkkmb/admin/maba?page=${currentPage}&limit=${currentLimit}&search=${searchQuery}&sortBy=${sort}&sortOrder=${order}`),
        apiFetch("/auth/me"),
      ]);

        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.success && authData.data) {
            const role = authData.data.role;
            const perms = (role && role.permissions) ? role.permissions : [];
            if (perms.includes('pkkmb.settings.manage') || perms.includes('manage:all')) {
              setHasSettingsManage(true);
            }
            if (authData.data.division === 'pendamping' || authData.data.division === 'Sie Pendamping') {
              setIsPendamping(true);
            }
          }
        }

        if (!res.ok) throw new Error("Gagal mengambil data maba");
        
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          if (json.pagination) {
            setPagination(json.pagination);
          } else if (json.meta) {
            const page = parseInt(json.meta.page) || 1;
            const limit = parseInt(json.meta.limit) || 20;
            const totalPages = Math.ceil(json.meta.total / limit) || 1;
            setPagination({
              page,
              limit,
              totalItems: json.meta.total,
              totalPages,
              hasNext: page < totalPages,
              hasPrevious: page > 1
            });
          }
        } else {
          throw new Error(json.message || "Unknown error");
        }
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchData(1, search, sortBy, sortOrder);
    }, 500);
    return () => clearTimeout(delay);
  }, [search, sortBy, sortOrder]);

  const handleAutoGroup = useCallback(async () => {
    setShowConfirmModal(false);
    setIsGrouping(true);
    try {
      const res = await apiFetch("/pkkmb/admin/groups/auto-assign?dryRun=false", {
        method: "POST",
      });
      const json = await res.json();
      
      if (res.ok && json.success) {
        setResultModal({ show: true, message: `Bagi Gugus Berhasil! ${json.totalMaba} maba dibagikan ke ${json.totalGroups} gugus.`, isError: false });
      } else {
        setResultModal({ show: true, message: "Gagal membagi gugus: " + (json.message || "Kesalahan pada server"), isError: true });
      }
    } catch (err: unknown) {
      setResultModal({ show: true, message: "Terjadi kesalahan jaringan: " + (err as Error).message, isError: true });
    } finally {
      setIsGrouping(false);
    }
  }, []);
  const closeResultAndReload = useCallback(() => {
    setResultModal(prev => ({ ...prev, show: false }));
    if (!resultModal.isError) {
      fetchData(pagination.page, search);
    }
  }, [resultModal.isError, pagination.page, search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowConfirmModal(false);
        setShowDetailModal(false);
        setDeleteModal({ show: false, id: '', name: '' });
        setBulkDeleteModal(false);
        if (resultModal.show) closeResultAndReload();
      }
      if (e.key === "Enter") {
        if (showConfirmModal) {
          e.preventDefault();
          handleAutoGroup();
        } else if (resultModal.show) {
          e.preventDefault();
          closeResultAndReload();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showConfirmModal, handleAutoGroup, resultModal.show, closeResultAndReload]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchData(newPage, search, sortBy, sortOrder);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };


  const triggerSetKetuaGugus = (mabaId: string, mabaName: string) => {
    setKetuaConfirmModal({ show: true, mabaId, mabaName });
  };

  const handleSetKetuaGugus = async () => {
    const { mabaId, mabaName } = ketuaConfirmModal;
    setKetuaConfirmModal({ show: false, mabaId: '', mabaName: '' });
    try {
      const res = await apiFetch("/pkkmb/admin/groups/set-ketua", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mabaId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setResultModal({ show: true, message: `Berhasil menetapkan ${mabaName} sebagai Ketua Gugus.`, isError: false });
        fetchData();
      } else {
        setResultModal({ show: true, message: json.message || "Gagal menetapkan Ketua Gugus", isError: true });
      }
    } catch (err: unknown) {
      setResultModal({ show: true, message: (err as Error).message || "Kesalahan Jaringan", isError: true });
    }
  };

  const triggerUnsetKetuaGugus = (mabaId: string, mabaName: string) => {
    setUnsetKetuaConfirmModal({ show: true, mabaId, mabaName });
  };

  const handleUnsetKetuaGugus = async () => {
    const { mabaId, mabaName } = unsetKetuaConfirmModal;
    setUnsetKetuaConfirmModal({ show: false, mabaId: '', mabaName: '' });
    try {
      const res = await apiFetch("/pkkmb/admin/groups/unset-ketua", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mabaId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setResultModal({ show: true, message: `Berhasil membatalkan status Ketua Gugus dari ${mabaName}.`, isError: false });
        fetchData();
      } else {
        setResultModal({ show: true, message: json.message || "Gagal membatalkan Ketua Gugus", isError: true });
      }
    } catch (err: unknown) {
      setResultModal({ show: true, message: (err as Error).message || "Kesalahan Jaringan", isError: true });
    }
  };


  const handleDeleteMaba = async (id: string, name: string) => {
    setDeleteModal({ show: false, id: '', name: '' });
    try {
      const res = await apiFetch(`/pkkmb/admin/users/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setResultModal({ show: true, message: `Berhasil menghapus data ${name}.`, isError: false });
        fetchData(pagination.page, search);
      } else {
        setResultModal({ show: true, message: json.message || "Gagal menghapus data", isError: true });
      }
    } catch (err: unknown) {
      setResultModal({ show: true, message: (err as Error).message || "Kesalahan Jaringan", isError: true });
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(data.map(m => m._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    setBulkDeleteModal(false);
    try {
      // Assuming backend supports DELETE /admin/users with body { ids } or we do Promise.all
      // For now, let's do Promise.all since there's no bulk endpoint defined yet
      await Promise.all(selectedIds.map((id) =>
        apiFetch(`/pkkmb/admin/users/${id}`, { method: "DELETE" }),
      ));
      setResultModal({ show: true, message: `Berhasil menghapus ${selectedIds.length} data terpilih.`, isError: false });
      setSelectedIds([]);
      fetchData(1, search);
    } catch (err: unknown) {
      setResultModal({ show: true, message: (err as Error).message || "Kesalahan Jaringan", isError: true });
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const downloadExcel = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/pkkmb/admin/export/maba`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Gagal mengunduh data");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data-maba-pkkmb-full.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setResultModal({ show: true, message: (err as Error).message || "Gagal mengunduh data", isError: true });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Data Mahasiswa Baru</h1>
          <p className="text-white/50 text-sm mt-1">Kelola dan lihat profil seluruh mahasiswa baru Fakultas Teknik.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {selectedIds.length > 0 && (
            <button 
              onClick={() => setBulkDeleteModal(true)}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              Hapus Terpilih ({selectedIds.length})
            </button>
          )}
          <input 
            type="search" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari NIM atau Nama..." 
            className="flex-1 md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-gold-500"
          />
          <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
            Filter
          </button>
          {hasSettingsManage && (
            <button 
              onClick={() => setShowConfirmModal(true)}
              disabled={isGrouping}
              className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {isGrouping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Bagi Gugus Otomatis
            </button>
          )}
          {hasSettingsManage && (
            <button 
              onClick={downloadExcel}
              disabled={isDownloading}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download Excel
            </button>
          )}
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden min-h-[400px] relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
          </div>
        )}
        
        {error && (
          <div className="p-8 text-center text-red-400 font-bold bg-red-500/10">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10 text-white/50">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={handleSelectAll}
                    className="rounded border-white/20 bg-black text-gold-500 focus:ring-gold-500/50 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('nim')}>
                  NIM {sortBy === 'nim' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                  Mahasiswa Baru {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('studyProgram')}>
                  Program Studi {sortBy === 'studyProgram' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 font-medium">Gugus</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Disabilitas</th>
                <th className="px-6 py-4 font-medium">Ketua Gugus</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!isLoading && !error && data.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-white/50">
                    Belum ada data mahasiswa baru yang tersimpan.
                  </td>
                </tr>
              )}
              {data.map((maba) => (
                <tr key={maba._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(maba._id)}
                      onChange={() => handleSelectOne(maba._id)}
                      className="rounded border-white/20 bg-black text-gold-500 focus:ring-gold-500/50 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 text-white">{maba.nim || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarImage src={maba.avatar} name={maba.name} />
                      <div>
                        <div className="font-bold text-white">{maba.name}</div>
                        <div className="text-white/50 text-xs">{maba.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/70">{maba.studyProgram || '-'}</td>
                  <td className="px-6 py-4 text-white/70">{maba.pkkmbGroup?.name || 'Belum Dibagi'}</td>
                  <td className="px-6 py-4">
                    {maba.isOnboarded ? (
                      <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md text-xs font-bold">Lengkap</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-xs font-bold">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {maba.disability?.isDisabled ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-md text-xs font-bold cursor-help"
                        title={maba.disability.description || "Mahasiswa dengan disabilitas"}
                      >
                        <Accessibility className="w-3.5 h-3.5" />
                        Disabilitas
                      </span>
                    ) : (
                      <span className="text-white/30">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {maba.pkkmbGroup?.ketuaGugusId === maba._id ? (
                      <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-xs font-bold">Ketua Gugus</span>
                    ) : (
                      <span className="text-white/30">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isPendamping && maba.pkkmbGroup && (
                        maba.pkkmbGroup.ketuaGugusId !== maba._id ? (
                          <button 
                            onClick={() => triggerSetKetuaGugus(maba._id, maba.name)}
                            className="text-amber-500 hover:text-amber-400 p-1.5 bg-amber-500/5 hover:bg-amber-500/20 rounded-lg transition-colors"
                            title="Jadikan Ketua Gugus"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => triggerUnsetKetuaGugus(maba._id, maba.name)}
                            className="text-red-400 hover:text-red-300 p-1.5 bg-red-400/5 hover:bg-red-400/20 rounded-lg transition-colors"
                            title="Batalkan Ketua Gugus"
                          >
                            <StarOff className="w-4 h-4" />
                          </button>
                        )
                      )}
                      <button 
                        onClick={() => { setSelectedMaba(maba); setShowDetailModal(true); }}
                        className="text-blue-500 hover:text-blue-400 p-1.5 bg-blue-500/5 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {hasSettingsManage && (
                        <button 
                          onClick={() => setDeleteModal({ show: true, id: maba._id, name: maba.name })}
                          className="text-red-500 hover:text-red-400 p-1.5 bg-red-500/5 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="sticky bottom-6 mt-4 p-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 text-white/50 text-sm shadow-2xl z-40">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <span>
            Menampilkan {pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.totalItems)} dari {pagination.totalItems} maba
          </span>
          <select 
            value={pagination.limit}
            onChange={(e) => {
              const newLimit = Number(e.target.value);
              setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
              fetchData(1, search, sortBy, sortOrder, newLimit);
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/70 outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 cursor-pointer"
          >
            <option value={10} className="bg-zinc-900">10 / hal</option>
            <option value={20} className="bg-zinc-900">20 / hal</option>
            <option value={30} className="bg-zinc-900">30 / hal</option>
            <option value={50} className="bg-zinc-900">50 / hal</option>
            <option value={100} className="bg-zinc-900">100 / hal</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button 
            disabled={!pagination.hasPrevious}
            onClick={() => handlePageChange(pagination.page - 1)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none hover:bg-white/10 transition-colors hover:text-white"
          >
            Sebelumnya
          </button>
          <div className="flex items-center px-4 font-bold text-white bg-white/[0.02] border border-white/10 rounded-xl">
            Hal {pagination.page} / {pagination.totalPages}
          </div>
          <button 
            disabled={!pagination.hasNext}
            onClick={() => handlePageChange(pagination.page + 1)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none hover:bg-white/10 transition-colors hover:text-white"
          >
            Selanjutnya
          </button>
        </div>
      </div>

      {/* Custom Confirm Modal for Ketua Gugus */}
      {ketuaConfirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1405] border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <h3 className="text-xl font-bold text-white mb-2 relative z-10 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Tetapkan Ketua Gugus
            </h3>
            <p className="text-amber-200/70 mb-6 text-sm relative z-10">
              Apakah Anda yakin ingin menjadikan <strong className="text-white">{ketuaConfirmModal.mabaName}</strong> sebagai Ketua Gugus?
            </p>
            <div className="flex justify-end gap-3 relative z-10">
              <button 
                onClick={() => setKetuaConfirmModal({ show: false, mabaId: '', mabaName: '' })}
                className="px-4 py-2 rounded-xl text-amber-200 hover:bg-amber-900/30 transition-colors text-sm font-semibold"
              >
                Batal
              </button>
              <button 
                onClick={handleSetKetuaGugus}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              >
                Jadikan Ketua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal for Unset Ketua Gugus */}
      {unsetKetuaConfirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1405] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <h3 className="text-xl font-bold text-white mb-2 relative z-10 flex items-center gap-2">
              <StarOff className="w-5 h-5 text-red-500" />
              Batalkan Ketua Gugus
            </h3>
            <p className="text-red-200/70 mb-6 text-sm relative z-10">
              Apakah Anda yakin ingin membatalkan <strong className="text-white">{unsetKetuaConfirmModal.mabaName}</strong> sebagai Ketua Gugus?
            </p>
            <div className="flex justify-end gap-3 relative z-10">
              <button 
                onClick={() => setUnsetKetuaConfirmModal({ show: false, mabaId: '', mabaName: '' })}
                className="px-4 py-2 rounded-xl text-red-200 hover:bg-red-900/30 transition-colors text-sm font-semibold"
              >
                Batal
              </button>
              <button 
                onClick={handleUnsetKetuaGugus}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                Batalkan Jabatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1405] border border-gold-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Konfirmasi Bagi Gugus</h3>
            <p className="text-gold-200/70 mb-6 text-sm">
              Aksi ini akan mendistribusikan mahasiswa baru yang belum mendapatkan gugus secara otomatis. Lanjutkan?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-gold-200 hover:bg-gold-900/30 transition-colors text-sm font-semibold"
              >
                Batal
              </button>
              <button 
                onClick={handleAutoGroup}
                disabled={isGrouping}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none shadow-lg shadow-gold-500/20"
              >
                {isGrouping ? "Membagikan..." : "Ya, Bagikan Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Result/Alert Modal */}
      {resultModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`border rounded-2xl p-6 max-w-md w-full shadow-2xl ${resultModal.isError ? 'bg-red-950 border-red-800/50' : 'bg-[#1a1405] border-gold-500/30'}`}>
            <h3 className="text-xl font-bold text-white mb-2">
              {resultModal.isError ? 'Gagal' : 'Berhasil'}
            </h3>
            <p className={`mb-6 text-sm ${resultModal.isError ? 'text-red-200/70' : 'text-gold-200/70'}`}>
              {resultModal.message}
            </p>
            <div className="flex justify-end">
              <button 
                onClick={closeResultAndReload}
                className={`px-6 py-2 rounded-xl text-white font-bold text-sm transition-all shadow-lg ${resultModal.isError ? 'bg-red-600 hover:bg-red-500 shadow-red-900/50' : 'bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 shadow-gold-900/50'}`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1405] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Hapus Mahasiswa</h3>
            <p className="text-red-200/70 mb-6 text-sm">
              Apakah Anda yakin ingin menghapus data <strong className="text-white">{deleteModal.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteModal({ show: false, id: '', name: '' })}
                className="px-4 py-2 rounded-xl text-red-200 hover:bg-red-900/30 transition-colors text-sm font-semibold"
              >
                Batal
              </button>
              <button 
                onClick={() => handleDeleteMaba(deleteModal.id, deleteModal.name)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-900/50"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1405] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Hapus {selectedIds.length} Mahasiswa</h3>
            <p className="text-red-200/70 mb-6 text-sm">
              Apakah Anda yakin ingin menghapus <strong className="text-white">{selectedIds.length}</strong> data mahasiswa yang dipilih? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setBulkDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-red-200 hover:bg-red-900/30 transition-colors text-sm font-semibold"
              >
                Batal
              </button>
              <button 
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-900/50"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedMaba && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1405] border border-gold-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Detail Mahasiswa Baru</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs text-white/50 block">Nama Lengkap</label>
                <div className="text-white font-medium">{selectedMaba.name}</div>
              </div>
              <div>
                <label className="text-xs text-white/50 block">NIM</label>
                <div className="text-white">{selectedMaba.nim || '-'}</div>
              </div>
              <div>
                <label className="text-xs text-white/50 block">Program Studi</label>
                <div className="text-white">{selectedMaba.studyProgram || '-'}</div>
              </div>
              <div>
                <label className="text-xs text-white/50 block">Gugus Adrista</label>
                <div className="text-white">{selectedMaba.pkkmbGroup?.name || 'Belum Dibagi'}</div>
              </div>
              <div>
                <label className="text-xs text-white/50 block">Status Onboarding</label>
                <div className="text-white">
                  {selectedMaba.isOnboarded ? 'Lengkap / Sudah Mengisi Data' : 'Pending / Belum Lengkap'}
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 block">Disabilitas</label>
                <div className="text-white">
                  {selectedMaba.disability?.isDisabled
                    ? (selectedMaba.disability.description || 'Ya — mahasiswa dengan disabilitas')
                    : 'Tidak'}
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 block">Peran di Gugus</label>
                <div className="text-white">
                  {selectedMaba.pkkmbGroup?.ketuaGugusId === selectedMaba._id ? 'Ketua Gugus' : 'Anggota Gugus'}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => { setShowDetailModal(false); setSelectedMaba(null); }}
                className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
