"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Edit, Trash2, Shield, Search, Info, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface UserData {
  _id: string;
  nim?: string;
  name: string;
  email: string;
  avatar?: string;
  role?: {
    _id: string;
    name: string;
    slug?: string;
  };
  division?: string;
  pkkmbGroup?: { _id: string; name: string };
}

// Deskripsi singkat per role untuk kartu pemilih role.
const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: "Akses penuh ke seluruh sistem",
  admin_pkkmb: "Kelola penuh modul PKKMB",
  panitia: "Panitia divisi — lengkapi divisi di bawah",
  sekretaris: "Sekretariat pelaksana",
  bendahara: "Pengelola keuangan pelaksana",
  ketua_pelaksana: "Pimpinan pelaksana PKKMB",
  pimpinan: "Pimpinan BEM & SC",
  user: "Mahasiswa baru (peserta PKKMB)",
  maba: "Mahasiswa baru (peserta PKKMB)",
};

// Preset divisi panitia — nilai diseragamkan ("Sie …") agar cocok dengan
// pemeriksaan divisi di backend (case-insensitive keyword).
const DIVISION_PRESETS: { value: string; label: string; desc: string }[] = [
  { value: "Sie KSK", label: "Sie KSK", desc: "Kesekretariatan — kelola presensi" },
  { value: "Sie Pendamping", label: "Sie Pendamping", desc: "Mentor gugus" },
  { value: "Sie Humas", label: "Sie Humas", desc: "Publikasi & hubungan masyarakat" },
  { value: "Sie Acara", label: "Sie Acara", desc: "Acara & pemateri" },
  { value: "Sie Perlengkapan", label: "Sie Perlengkapan", desc: "Logistik & sarana" },
  { value: "Sie Pemateri", label: "Sie Pemateri", desc: "Materi & evaluasi" },
  { value: "Sie Tata Tertib", label: "Sie Tata Tertib", desc: "Ketertiban & komdis" },
  { value: "BPH (Inti)", label: "BPH (Inti)", desc: "Badan pengurus harian" },
  { value: "Sekretaris", label: "Sekretaris", desc: "Sekretariat pelaksana" },
  { value: "Bendahara", label: "Bendahara", desc: "Keuangan pelaksana" },
];

// Hint singkat yang muncul saat sebuah divisi dipilih.
const DIVISION_HINTS: Record<string, string> = {
  "Sie KSK": "Mengelola sesi presensi & memverifikasi izin mahasiswa.",
  "Sie Pendamping": "Menjadi mentor gugus — melihat data maba & presensi gugusnya.",
  "Sie Acara": "Akses pemateri/acara — ikut mengevaluasi penugasan.",
  "Sie Pemateri": "Akses evaluasi penugasan mahasiswa.",
  "Sie Tata Tertib": "Mencatat insiden ketertiban mahasiswa.",
  "BPH (Inti)": "Level pimpinan (bph) — akses lebih luas.",
  Sekretaris: "Level sekretaris — termasuk pengelolaan presensi.",
};

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

export default function UserManagementPage() {
  const [data, setData] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false
  });

  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean, id: string, name: string }>({ show: false, id: '', name: '' });
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [resultModal, setResultModal] = useState<{ show: boolean, message: string, isError: boolean }>({ show: false, message: '', isError: false });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nim: '',
    role: '',
    password: '',
    division: '',
    pkkmbGroup: ''
  });

  const [roles, setRoles] = useState<{_id: string, name: string, slug?: string}[]>([]);
  const [divisionCustom, setDivisionCustom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const fetchUsers = useCallback(async (currentPage = pagination.page, searchQuery = search, sort = sortBy, order = sortOrder, currentLimit = pagination.limit) => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/pkkmb/admin/users?page=${currentPage}&limit=${currentLimit}&search=${searchQuery}&sortBy=${sort}&sortOrder=${order}`);

      if (!res.ok) throw new Error("Gagal mengambil data users");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.pagination) {
          setPagination(json.pagination);
        } else if (json.meta) {
          const page = parseInt(json.meta.page) || 1;
          const limit = parseInt(json.meta.limit) || 10;
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
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, search, sortBy, sortOrder]);

  const fetchRoles = async () => {
    try {
      const res = await apiFetch("/pkkmb/roles");
      const json = await res.json();
      if (json.success) setRoles(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Use simple timeout debounce for search
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchUsers(1, search, sortBy, sortOrder);
    }, 500);
    return () => clearTimeout(delay);
  }, [search, sortBy, sortOrder]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRoles();
  }, []);

  const executeDelete = useCallback(async () => {
    if (!confirmDelete.id) return;
    try {
      const res = await apiFetch(`/pkkmb/admin/users/${confirmDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setResultModal({ show: true, message: "User berhasil dihapus", isError: false });
        fetchUsers();
      } else {
        setResultModal({ show: true, message: json.message || "Gagal menghapus user", isError: true });
      }
    } catch (err: unknown) {
      setResultModal({ show: true, message: "Error: " + (err as Error).message, isError: true });
    } finally {
      setConfirmDelete({ show: false, id: '', name: '' });
    }
  }, [confirmDelete.id, fetchUsers]);

  const executeBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    try {
      setConfirmBulkDelete(false);
      setIsLoading(true);
      
      const promises = selectedIds.map(id => 
        apiFetch(`/pkkmb/admin/users/${id}`, {
          method: "DELETE",
        }).then(r => r.json())
      );
      
      const results = await Promise.all(promises);
      const allSuccess = results.every(r => r.success);
      
      if (allSuccess) {
        setResultModal({ show: true, message: `Berhasil menghapus ${selectedIds.length} user`, isError: false });
        setSelectedIds([]);
        fetchUsers();
      } else {
        setResultModal({ show: true, message: "Beberapa user mungkin gagal dihapus", isError: true });
        setSelectedIds([]);
        fetchUsers();
      }
    } catch (err: unknown) {
      setResultModal({ show: true, message: "Error: " + (err as Error).message, isError: true });
    } finally {
      setIsLoading(false);
    }
  }, [selectedIds, fetchUsers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);
        setConfirmDelete({ show: false, id: '', name: '' });
        setConfirmBulkDelete(false);
        setResultModal({ show: false, message: '', isError: false });
      }
      if (e.key === "Enter") {
        if (confirmDelete.show) {
          e.preventDefault();
          executeDelete();
        } else if (confirmBulkDelete) {
          e.preventDefault();
          executeBulkDelete();
        } else if (resultModal.show) {
          e.preventDefault();
          setResultModal(prev => ({ ...prev, show: false }));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmDelete.show, confirmBulkDelete, resultModal.show, executeDelete, executeBulkDelete]);

  const handleOpenCreate = () => {
    setModalMode("CREATE");
    setFormError("");
    setFormData({ name: '', email: '', nim: '', role: '', password: '', division: '', pkkmbGroup: '' });
    setDivisionCustom(false);
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserData) => {
    setModalMode("EDIT");
    setSelectedUser(user);
    setFormError("");
    setFormData({
      name: user.name,
      email: user.email,
      nim: user.nim || '',
      role: user.role?._id || '',
      password: '',
      division: user.division || '',
      pkkmbGroup: user.pkkmbGroup?._id || ''
    });
    setDivisionCustom(
      !!user.division && !DIVISION_PRESETS.some((p) => p.value === user.division),
    );
    setShowModal(true);
  };

  const handleConfirmDelete = (id: string, name: string) => {
    setConfirmDelete({ show: true, id, name });
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Custom Validation
    if (!formData.name.trim()) { setFormError("Nama lengkap harus diisi"); return; }
    if (!formData.email.trim()) { setFormError("Email harus diisi"); return; }
    if (!formData.role) { setFormError("Role harus dipilih"); return; }
    const selectedRoleSlug = roles.find(r => r._id === formData.role)?.slug;
    if (selectedRoleSlug === "panitia" && !formData.division.trim()) {
      setFormError("Divisi wajib diisi untuk role Panitia");
      return;
    }
    if (modalMode === "CREATE" && !formData.password) { setFormError("Password wajib diisi untuk user baru"); return; }

    setIsSubmitting(true);
    
    try {
      const url = modalMode === "CREATE" 
        ? "/pkkmb/admin/users" 
        : `/pkkmb/admin/users/${selectedUser?._id}`;
      
      const method = modalMode === "CREATE" ? "POST" : "PATCH";

      // Filter out empty strings
      const payload: Record<string, unknown> = { ...formData };
      if (!payload.password) delete payload.password;
      if (!payload.nim) delete payload.nim;
      if (!payload.division) delete payload.division;
      if (!payload.pkkmbGroup) delete payload.pkkmbGroup;

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const json = await res.json();
      if (res.ok && json.success) {
        setResultModal({ show: true, message: modalMode === "CREATE" ? "Berhasil membuat user" : "Berhasil update user", isError: false });
        setShowModal(false);
        fetchUsers();
      } else {
        setResultModal({ show: true, message: json.message || "Terjadi kesalahan", isError: true });
      }
    } catch (err: unknown) {
      setResultModal({ show: true, message: "Error: " + (err as Error).message, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchUsers(newPage, search, sortBy, sortOrder);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newIds = [...selectedIds];
      data.forEach(user => {
        if (!newIds.includes(user._id)) newIds.push(user._id);
      });
      setSelectedIds(newIds);
    } else {
      const newIds = selectedIds.filter(id => !data.some(u => u._id === id));
      setSelectedIds(newIds);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Manajemen Akun</h1>
          <p className="text-white/50 text-sm mt-1">Kelola seluruh akses Panitia, Admin, dan Mahasiswa.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-white/40" />
            <input 
              type="search" 
              placeholder="Cari Nama/NIM/Email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-gold-500"
            />
          </div>
          {selectedIds.length > 0 && (
            <button 
              onClick={() => setConfirmBulkDelete(true)}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Hapus ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            User Baru
          </button>
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

        {data.length === 0 && !isLoading && (
          <div className="p-8 text-center text-white/50">
            Tidak ada data user.
          </div>
        )}



        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10 text-white/50">
              <tr>
                <th className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={data.length > 0 && data.every(user => selectedIds.includes(user._id))}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold-500 focus:ring-gold-500/50 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                  Nama / Email {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('nim')}>
                  NIM {sortBy === 'nim' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 font-medium">Role (Hak Akses)</th>
                <th className="px-6 py-4 font-medium">Divisi / Gugus</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((user) => (
                <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(user._id)}
                      onChange={() => handleSelectRow(user._id)}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold-500 focus:ring-gold-500/50 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarImage src={user.avatar} name={user.name} />
                      <div>
                        <div className="font-bold text-white">{user.name}</div>
                        <div className="text-white/50 text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/70">{user.nim || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-2 py-1 bg-white/5 text-gold-400 border border-white/10 rounded-md text-xs font-bold inline-flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {user.role?.name || '-'}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(() => {
                          const roleName = (user.role?.name || '').toLowerCase();
                          const roleSlug = (user.role?.slug || '').toLowerCase();
                          const isPkkmbPortal =
                            ['super_admin', 'pimpinan', 'ketua_pelaksana', 'sekretaris', 'bendahara', 'panitia'].includes(roleSlug) ||
                            roleName.includes('super admin') ||
                            roleName.includes('pimpinan') ||
                            roleName.includes('ketua pelaksana') ||
                            roleName.includes('sekretaris') ||
                            roleName.includes('bendahara') ||
                            roleName.includes('panitia');
                          const isMaba =
                            roleSlug === 'user' ||
                            roleName.includes('mahasiswa baru');
                          if (isPkkmbPortal) {
                            return (
                              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded border border-green-500/30 font-bold uppercase tracking-wider">PKKMB</span>
                            );
                          }
                          if (isMaba) {
                            return (
                              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded border border-blue-500/30 font-bold uppercase tracking-wider">MABA</span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/70">
                    {(() => {
                      const roleName = (user.role?.name || '').toLowerCase();
                      const isMaba = user.role?.slug === 'maba' || roleName.includes('mahasiswa baru');
                      if (!isMaba) return '-';
                      return (
                        <>
                          {user.division && <div className="text-xs text-blue-400 font-bold uppercase">{user.division}</div>}
                          {user.pkkmbGroup && <div className="text-xs text-green-400 mt-1">{user.pkkmbGroup.name}</div>}
                          {!user.division && !user.pkkmbGroup && '-'}
                        </>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenEdit(user)} className="text-white/50 hover:text-white transition-colors p-2 bg-white/5 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleConfirmDelete(user._id, user.name)} className="text-red-500/50 hover:text-red-400 transition-colors p-2 bg-red-500/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
            Menampilkan {pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.totalItems)} dari {pagination.totalItems} user
          </span>
          <select 
            value={pagination.limit}
            onChange={(e) => {
              const newLimit = Number(e.target.value);
              setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
              fetchUsers(1, search, sortBy, sortOrder, newLimit);
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1405] border border-gold-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-white mb-4">
              {modalMode === "CREATE" ? "Tambah User Baru" : "Edit Data User"}
            </h3>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/50">Nama Lengkap *</label>
                <input required type="text" value={formData.name} onChange={e => {setFormData({...formData, name: e.target.value}); setFormError("");}} className={`w-full bg-white/5 border ${formError.includes("Nama") ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-2 mt-1 text-white focus:border-gold-500 outline-none`} />
              </div>
              
              <div>
                <label className="text-xs font-bold text-white/50">Email *</label>
                <input required type="email" value={formData.email} onChange={e => {setFormData({...formData, email: e.target.value}); setFormError("");}} className={`w-full bg-white/5 border ${formError.includes("Email") ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-2 mt-1 text-white focus:border-gold-500 outline-none`} />
              </div>

              <div>
                <label className="text-xs font-bold text-white/50">NIM</label>
                <input type="text" value={formData.nim} onChange={e => setFormData({...formData, nim: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-1 text-white focus:border-gold-500 outline-none" />
              </div>

              <div>
                <label className="text-xs font-bold text-white/50">Role (Hak Akses) *</label>
                {formError.includes("Role") && (
                  <p className="text-xs text-red-400 mt-1">Role harus dipilih</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {roles.map(r => {
                    const selected = formData.role === r._id;
                    const desc = ROLE_DESCRIPTIONS[r.slug || ''] || 'Akses sesuai hak yang diberikan';
                    return (
                      <button
                        type="button"
                        key={r._id}
                        onClick={() => { setFormData({...formData, role: r._id}); setFormError(""); }}
                        className={`text-left px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                          selected
                            ? "border-gold-500 bg-gold-500/10 shadow-[0_0_12px_rgba(234,179,8,0.15)]"
                            : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className={`flex items-center justify-between gap-2 text-sm font-bold ${selected ? "text-gold-400" : "text-white/90"}`}>
                          {r.name}
                          {selected && <Check className="w-4 h-4 shrink-0 text-gold-400" />}
                        </div>
                        <div className="text-[11px] text-white/40 mt-0.5 leading-snug">{desc}</div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-white/35 mt-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  Perubahan role/divisi berlaku setelah user login ulang.
                </p>
              </div>

              {(() => {
                const selectedRoleSlug = roles.find(r => r._id === formData.role)?.slug;
                if (selectedRoleSlug === 'maba') return null;
                // Panitia: pilih divisi via chip preset (nilai sudah diseragamkan)
                if (selectedRoleSlug === 'panitia') {
                  return (
                    <div>
                      <label className="text-xs font-bold text-white/50">Divisi / Sie *</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {DIVISION_PRESETS.map(p => {
                          const active = !divisionCustom && formData.division === p.value;
                          return (
                            <button
                              type="button"
                              key={p.value}
                              title={p.desc}
                              onClick={() => { setFormData({...formData, division: p.value}); setDivisionCustom(false); setFormError(""); }}
                              className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-200 ${
                                active
                                  ? "border-gold-500 bg-gold-500/15 text-gold-400"
                                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:text-white"
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => { setDivisionCustom(v => !v); setFormError(""); }}
                          className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-200 ${
                            divisionCustom
                              ? "border-gold-500 bg-gold-500/15 text-gold-400"
                              : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:text-white"
                          }`}
                        >
                          {divisionCustom ? "✕ Kustom" : "Lainnya…"}
                        </button>
                      </div>
                      {divisionCustom ? (
                        <input
                          type="text"
                          placeholder="Tulis nama divisi kustom…"
                          value={formData.division}
                          onChange={e => setFormData({...formData, division: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-2 text-white focus:border-gold-500 outline-none"
                        />
                      ) : (
                        formData.division && !DIVISION_PRESETS.some(p => p.value === formData.division) && (
                          <input
                            type="text"
                            value={formData.division}
                            onChange={e => setFormData({...formData, division: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-2 text-white focus:border-gold-500 outline-none"
                          />
                        )
                      )}
                      {formData.division && DIVISION_HINTS[formData.division] && (
                        <p className="text-[11px] text-gold-400/80 mt-2 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          {DIVISION_HINTS[formData.division]}
                        </p>
                      )}
                    </div>
                  );
                }
                // Role non-panitia lain: input teks biasa (perilaku lama)
                return (
                  <div>
                    <label className="text-xs font-bold text-white/50">Divisi / Sie (Bila Perlu)</label>
                    <input type="text" placeholder="Contoh: KSK, pendamping, sekretariat" value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-1 text-white focus:border-gold-500 outline-none" />
                  </div>
                );
              })()}

              <div>
                <label className="text-xs font-bold text-white/50">ID Gugus (Bila perlu)</label>
                <input type="text" placeholder="Object ID Gugus" value={formData.pkkmbGroup} onChange={e => setFormData({...formData, pkkmbGroup: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-1 text-white focus:border-gold-500 outline-none" />
              </div>

              <div>
                <label className="text-xs font-bold text-white/50">
                  Password {modalMode === "EDIT" && "(Isi jika ingin mereset)"} {modalMode === "CREATE" && "*"}
                </label>
                <input required={modalMode === "CREATE"} type="password" value={formData.password} onChange={e => {setFormData({...formData, password: e.target.value}); setFormError("");}} className={`w-full bg-white/5 border ${formError.includes("Password") ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-2 mt-1 text-white focus:border-gold-500 outline-none`} />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-gold-200 hover:bg-gold-900/30 font-semibold text-sm">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none">
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1405] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Hapus User</h3>
            <p className="text-red-200/70 mb-6 text-sm">
              Apakah Anda yakin ingin menghapus user <strong>{confirmDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmDelete({ show: false, id: '', name: '' })}
                className="px-4 py-2 rounded-xl text-red-200 hover:bg-red-900/30 transition-colors text-sm font-semibold"
              >
                Batal
              </button>
              <button 
                onClick={executeDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-900/50"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1405] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Hapus {selectedIds.length} User</h3>
            <p className="text-red-200/70 mb-6 text-sm">
              Apakah Anda yakin ingin menghapus <strong>{selectedIds.length}</strong> user yang dipilih? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmBulkDelete(false)}
                className="px-4 py-2 rounded-xl text-red-200 hover:bg-red-900/30 transition-colors text-sm font-semibold"
              >
                Batal
              </button>
              <button 
                onClick={executeBulkDelete}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors shadow-lg shadow-red-500/20"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Alert Modal */}
      {resultModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`border rounded-2xl p-6 max-w-md w-full shadow-2xl ${resultModal.isError ? 'bg-red-950 border-red-800/50' : 'bg-[#1a1405] border-gold-500/30'}`}>
            <h3 className="text-xl font-bold text-white mb-2">
              {resultModal.isError ? 'Kesalahan' : 'Berhasil'}
            </h3>
            <p className={`mb-6 text-sm ${resultModal.isError ? 'text-red-200/70' : 'text-gold-200/70'}`}>
              {resultModal.message}
            </p>
            <div className="flex justify-end">
              <button 
                onClick={() => setResultModal({ ...resultModal, show: false })}
                className={`px-6 py-2 rounded-xl text-white font-bold text-sm transition-all shadow-lg ${resultModal.isError ? 'bg-red-600 hover:bg-red-500 shadow-red-900/50' : 'bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 shadow-gold-900/50'}`}
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
