"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import { CustomSelect } from "@/components/ui/CustomSelect";
import ImsApiService from "@/lib/api";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Info,
  CheckCircle,
  X,
  Shield,
  Building,
  Mail,
} from "lucide-react";
import { useConfirm } from "@/components/ui/CustomConfirm";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  nim?: string;
  position: string;
  role?: { _id: string; slug: string; name: string };
  department?: { _id: string; name: string };
  isActive: boolean;
  cabinetPeriod?: string;
}

interface Department {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface RoleItem {
  _id: string;
  name: string;
  slug: string;
  scope?: string;
}

const emptyForm = {
  name: "",
  email: "",
  nim: "",
  position: "",
  role: "",
  department: "",
  isActive: true,
};

export default function FungsionarisPage() {
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const dialogRef = React.useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (modalOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [modalOpen]);

  // Auto-dismiss success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const loadDeps = async () => {
    try {
      const [deptRes, roleRes] = await Promise.all([
        ImsApiService.getDepartments<Department>(),
        ImsApiService.getRoles<RoleItem>(),
      ]);
      if (deptRes?.data) setDepartments(deptRes.data.filter((d) => d.isActive));
      if (roleRes?.data) setRoles(roleRes.data);
      else if (Array.isArray(roleRes)) {
        const isRoleArray = (obj: unknown): obj is RoleItem[] => Array.isArray(obj);
        if (isRoleArray(roleRes)) setRoles(roleRes);
      }
    } catch (err) {
      console.error("Gagal memuat data pendukung:", err);
    }
  };

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ImsApiService.getUsers<UserItem>(filterDept || undefined);
      if (res?.data) setUsers(res.data);
      else if (Array.isArray(res)) {
        const isUserArray = (obj: unknown): obj is UserItem[] => Array.isArray(obj);
        if (isUserArray(res)) setUsers(res);
      }
    } catch {
      setError("Gagal memuat daftar fungsionaris.");
    } finally {
      setLoading(false);
    }
  }, [filterDept]);

  useEffect(() => { 
    const timer = setTimeout(() => {
      loadDeps();
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.nim && u.nim.includes(q)) ||
      u.position.toLowerCase().includes(q)
    );
  });

  const selectedRole = roles.find((r) => r._id === formData.role);
  const isGlobalRole = selectedRole?.scope === "global";

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setModalOpen(true);
    setError(null);
  };

  const openEdit = (u: UserItem) => {
    setEditingId(u._id);
    setFormData({
      name: u.name,
      email: u.email,
      nim: u.nim || "",
      position: u.position,
      role: typeof u.role === "object" ? u.role?._id || "" : "",
      department: typeof u.department === "object" ? u.department?._id || "" : "",
      isActive: u.isActive,
    });
    setModalOpen(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      name: formData.name,
      email: formData.email,
      position: formData.position,
      role: formData.role,
      isActive: formData.isActive,
    };
    if (formData.nim) payload.nim = formData.nim;
    if (!isGlobalRole && formData.department) {
      payload.department = formData.department;
    } else {
      payload.department = null;
    }

    try {
      if (editingId) {
        await ImsApiService.updateUser(editingId, payload);
        setSuccess("Fungsionaris berhasil diperbarui.");
      } else {
        await ImsApiService.createUser(payload);
        setSuccess("Fungsionaris berhasil ditambahkan.");
      }
      setModalOpen(false);
      loadUsers();
    } catch (err: unknown) {
      setError((err as Error)?.message || "Gagal menyimpan data fungsionaris.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u: UserItem) => {
    const ok = await confirm({
      title: "Hapus Fungsionaris",
      message: `Yakin ingin menghapus "${u.name}"?`,
      type: "danger",
      confirmLabel: "Ya, Hapus",
    });
    if (!ok) return;
    setError(null);
    setSuccess(null);
    try {
      await ImsApiService.deleteUser(u._id);
      setSuccess("Fungsionaris berhasil dihapus.");
      loadUsers();
    } catch (err: unknown) {
      setError((err as Error)?.message || "Gagal menghapus fungsionaris.");
    }
  };

  const isRoleRedundant = (pos: string, role: string) => {
    const p = pos.toLowerCase().replace(/ketua/g, 'kepala').trim();
    const r = role.toLowerCase().replace(/ketua/g, 'kepala').replace('administrator', 'admin').trim();
    return p === r || p.includes(r) || r.includes(p);
  };

  return (
    <DashboardShell allowedRoles={['super-admin', 'kabem', 'wakabem', 'sekretaris', 'sekretaris-umum', 'sekretaris-administrasi', 'sekretaris-kegiatan']}>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hairline pb-6">
          <div>
             <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-ink tracking-tight">Fungsionaris</h1>
              {!loading && (
                <span className="text-xs font-bold bg-surface-2 text-ink-muted px-2.5 py-1 rounded-full border border-hairline">
                  {users.length}
                </span>
              )}
            </div>
            <p className="text-sm text-ink-subtle mt-1">
              Kelola data fungsionaris, jabatan, role, dan departemen anggota BEM FT.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="fixed bottom-6 right-6 z-40 md:static md:bottom-auto md:right-auto bg-primary hover:bg-primary-hover text-on-primary font-medium py-3 px-6 md:py-2.5 md:px-5 rounded-md md:rounded-lg text-sm flex items-center gap-2 transition-all active:scale-95 md: border border-primary-focus"
          >
            <Plus size={18} className="md:w-4 md:h-4" /> Tambah Fungsionaris
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm animate-fade-in">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400"><X size={14} /></button>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm animate-fade-in">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 bg-surface-1 p-4 rounded-xl border border-hairline">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-3.5 text-ink-subtle" size={16} />
            <input
              type="text"
              placeholder="Cari nama, email, NIM, atau jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-canvas border border-hairline rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink placeholder-ink-subtle focus:outline-none focus:border-hairline-strong focus:ring-1 focus:ring-hairline-strong"
            />
          </div>
          <div className="w-full md:w-56 relative z-20">
            <CustomSelect
              value={filterDept}
              onChange={setFilterDept}
              options={[
                { value: "", label: "Semua Departemen" },
                ...departments.map((d) => ({ value: d._id, label: d.name })),
              ]}
              className="bg-canvas border border-hairline rounded-lg py-2.5 text-sm text-ink focus:border-hairline-strong"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 animate-spin rounded-full border-4 border-surface-3 border-t-primary" />
            <span className="text-sm text-ink-muted">Memuat fungsionaris...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-hairline rounded-xl bg-surface-1 text-ink-muted text-sm gap-2">
            <Users size={32} className="text-ink-tertiary" />
            <span>{searchQuery || filterDept ? "Tidak ada fungsionaris yang cocok." : "Belum ada fungsionaris."}</span>
          </div>
        ) : (
          <div className="bg-surface-1 border border-hairline rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-2 text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-hairline">
                    <th className="px-6 py-4">Profil</th>
                    <th className="px-6 py-4">Posisi & Akses</th>
                    <th className="px-6 py-4 text-center w-24">Status</th>
                    <th className="px-6 py-4 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-sm text-ink">
                  {filtered.map((u) => (
                    <tr key={u._id} className="hover:bg-surface-2 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-ink leading-snug">{u.name}</span>
                          <span className="text-[11px] text-ink-muted flex items-center gap-1.5 mt-0.5">
                            <span className="flex items-center gap-1"><Mail size={10} /> {u.email}</span>
                            {u.nim && <span className="text-ink-tertiary">•</span>}
                            {u.nim && <span className="font-mono">{u.nim}</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="text-sm font-medium leading-snug flex items-center gap-2">
                             {u.position}
                             {typeof u.role === "object" && isRoleRedundant(u.position, u.role.name) && (
                               <Shield size={12} className="text-ink-subtle" />
                             )}
                           </span>
                           <div className="flex items-center gap-3 mt-1">
                             {typeof u.role === "object" && !isRoleRedundant(u.position, u.role.name) && (
                               <span className="text-[11px] flex items-center gap-1 text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
                                  <Shield size={10} />
                                  {u.role.name}
                               </span>
                             )}
                             {u.department && typeof u.department === "object" && (
                               <span className="text-[11px] flex items-center gap-1 text-ink-muted">
                                  <Building size={10} />
                                  {u.department.name}
                               </span>
                             )}
                           </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          u.isActive
                            ? "bg-semantic-success/10 text-semantic-success border-semantic-success/20"
                            : "bg-surface-3 text-ink-muted border-hairline-strong"
                        }`}>
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(u)} className="p-2 hover:bg-surface-3 rounded-md text-ink-subtle hover:text-ink transition-all active:scale-90" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(u)} className="p-2 hover:bg-red-500/10 rounded-md text-red-400 hover:text-red-300 transition-all active:scale-90" title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        <dialog
          ref={dialogRef}
          className="bg-surface-1 border border-hairline-strong rounded-xl w-full max-w-lg overflow-hidden bg-surface-1 p-0 backdrop:backdrop-blur-sm backdrop:bg-black/60 m-auto animate-fade-in"
          onClose={() => setModalOpen(false)}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          {modalOpen && (
            <div className="flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-hairline flex justify-between items-center bg-surface-2">
                <h2 className="text-lg font-bold text-ink">
                  {editingId ? "Edit Fungsionaris" : "Tambah Fungsionaris"}
                </h2>
                <button type="button" onClick={() => setModalOpen(false)} className="text-ink-subtle hover:text-ink p-1 rounded-md hover:bg-surface-3">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Nama Lengkap *</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Nama lengkap sesuai KTP/KTM"
                    className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong placeholder-ink-subtle"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Email UNESA *</label>
                  <input
                    type="email" required
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="nama@mhs.unesa.ac.id"
                    className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong placeholder-ink-subtle"
                  />
                  <span className="text-[10px] text-ink-tertiary">Gunakan email resmi institusi untuk login.</span>
                </div>

                {/* NIM */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">NIM</label>
                  <input
                    type="text"
                    value={formData.nim}
                    onChange={(e) => setFormData((p) => ({ ...p, nim: e.target.value }))}
                    placeholder="11 digit angka"
                    className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong w-full md:w-1/2 placeholder-ink-subtle"
                  />
                </div>

                {/* Position */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Jabatan / Posisi *</label>
                  <input
                    type="text" required
                    value={formData.position}
                    onChange={(e) => setFormData((p) => ({ ...p, position: e.target.value }))}
                    placeholder="Contoh: Kepala Departemen Komunikasi"
                    className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong placeholder-ink-subtle"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                   {/* Role */}
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Role Hak Akses *</label>
                    <div className="relative w-full z-20">
                      <CustomSelect
                        value={formData.role}
                        onChange={(val) => setFormData((p) => ({ ...p, role: val }))}
                        options={[
                          { value: "", label: "Pilih Role..." },
                          ...roles.map((r) => ({ value: r._id, label: `${r.name}${r.scope === "global" ? " (Global)" : ""}` })),
                        ]}
                        className="bg-canvas border border-hairline rounded-lg py-2.5 text-sm text-ink focus:border-hairline-strong w-full"
                      />
                    </div>
                  </div>

                  {/* Department — hide for global roles */}
                  <div className="flex flex-col gap-1.5 flex-1">
                     <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Departemen</label>
                     <div className="relative w-full z-10">
                        <CustomSelect
                           value={formData.department}
                           onChange={(val) => setFormData((p) => ({ ...p, department: val }))}
                           disabled={isGlobalRole}
                           options={[
                             { value: "", label: isGlobalRole ? "Tidak Berlaku" : "Tanpa Departemen" },
                             ...departments.map((d) => ({ value: d._id, label: d.name })),
                           ]}
                           className={`bg-canvas border border-hairline rounded-lg py-2.5 text-sm text-ink focus:border-hairline-strong w-full ${isGlobalRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                     </div>
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3 mt-2 p-3 bg-surface-2 border border-hairline rounded-lg">
                  <div className="flex-1">
                     <label className="text-sm font-bold text-ink block">Status Akses Akun</label>
                     <span className="text-[11px] text-ink-subtle">Akun nonaktif tidak bisa login ke dalam IMS.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, isActive: !p.isActive }))}
                    className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                      formData.isActive ? "bg-primary" : "bg-surface-3"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.isActive ? "translate-x-6" : ""
                    }`} />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary-hover text-on-primary font-medium py-2.5 rounded-lg transition-all active:scale-95 text-sm mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-primary-focus"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Menyimpan...</>
                  ) : (
                    editingId ? "Simpan Perubahan" : "Tambah Fungsionaris"
                  )}
                </button>
              </form>
            </div>
          )}
        </dialog>
      </div>
    </DashboardShell>
  );
}
