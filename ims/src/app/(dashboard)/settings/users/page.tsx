/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import { ImsApiService, UserItem, RoleItem, CabinetPeriodItem, UserPayload } from "@/lib/api";
import { FormInput, FormSelect, DataTable, StatusBadge } from "@/components/ui";
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Pencil, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  X, 
  CheckCircle,
  User
} from "lucide-react";

interface DepartmentItem {
  _id: string;
  name: string;
  code?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [cabinetPeriods, setCabinetPeriods] = useState<CabinetPeriodItem[]>([]);
  const [currentCabinetId, setCurrentCabinetId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Filters and Search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nim: "",
    email: "",
    phone: "",
    position: "",
    roleId: "",
    department: "",
    cabinetPeriod: "",
    isActive: true,
  });

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Alert & toast helper (Hoisted/Declared at the top of logic)
  const showToast = useCallback((type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch initial supporting data: roles, departments, cabinet periods, and user profile
  const fetchMetadata = useCallback(async () => {
    try {
      const [rolesRes, deptsRes, cabinetsRes, profileRes] = await Promise.all([
        ImsApiService.getRoles(),
        ImsApiService.getDepartments(),
        ImsApiService.getCabinetPeriods(),
        ImsApiService.getProfile().catch(() => null)
      ]);

      setRoles(rolesRes.data || []);
      setDepartments(deptsRes.data || []);
      setCabinetPeriods(cabinetsRes.data || []);

      if (profileRes?.data?.activeContext?.periodId) {
        setCurrentCabinetId(profileRes.data.activeContext.periodId);
      } else if (profileRes?.data?.cabinetPeriod) {
        setCurrentCabinetId(typeof profileRes.data.cabinetPeriod === "string" 
          ? profileRes.data.cabinetPeriod 
          : (profileRes.data.cabinetPeriod as { _id?: string })?._id || ""
        );
      }
    } catch (err) {
      console.error("Gagal memuat data pendukung:", err);
      showToast("error", "Gagal memuat daftar role, departemen, atau kabinet.");
    }
  }, [showToast]);

  // Fetch Users list with query parameters
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const query = {
        page,
        limit,
        search: debouncedSearch || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
      };

      const res = await ImsApiService.getUsers(query);
      let fetchedUsers = res.data || [];

      // Filter by status on frontend if backend doesn't support direct status query parameter
      if (statusFilter !== "all") {
        const activeTarget = statusFilter === "active";
        fetchedUsers = fetchedUsers.filter((u) => u.isActive === activeTarget);
      }

      setUsers(fetchedUsers);
      
      // Handle pagination metadata from server response
      const meta = res.meta;
      if (meta) {
        setTotalPages(meta.totalPages || 1);
        setTotalItems(meta.total || fetchedUsers.length);
      } else {
        setTotalPages(1);
        setTotalItems(fetchedUsers.length);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal memuat data user dari server.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  // Run initial metadata fetch deferred to prevent synchronous setState lint issues
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMetadata();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMetadata]);

  // Run users list fetch deferred to prevent synchronous setState lint issues
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleRefresh = () => {
    fetchUsers();
    showToast("success", "Data berhasil diperbarui.");
  };

  // Open modal for creating a new user
  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      nim: "",
      email: "",
      phone: "",
      position: "",
      roleId: roles[0]?._id || "",
      department: "",
      cabinetPeriod: currentCabinetId,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing an existing user
  const openEditModal = useCallback((user: UserItem) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      nim: user.nim || "",
      email: user.email,
      phone: user.phone || "",
      position: user.position || "",
      roleId: user.role?._id || "",
      department: user.department?._id || "",
      cabinetPeriod: typeof user.cabinetPeriod === "string" 
        ? user.cabinetPeriod 
        : (user.cabinetPeriod as { _id?: string })?._id || "",
      isActive: user.isActive,
    });
    setIsModalOpen(true);
  }, []);

  // Toggle user active status directly
  const handleToggleStatus = useCallback(async (user: UserItem) => {
    const actionName = user.isActive ? "menonaktifkan" : "mengaktifkan";
    if (!confirm(`Apakah Anda yakin ingin ${actionName} user ${user.name}?`)) return;

    try {
      setLoading(true);
      await ImsApiService.updateUser(user._id, { isActive: !user.isActive });
      
      // Optimistic update
      setUsers((prevUsers) => prevUsers.map((u) => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
      showToast("success", `Berhasil ${actionName} user.`);
    } catch (err) {
      console.error(err);
      showToast("error", `Gagal mengubah status aktif user.`);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Handle create/edit form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple Validation
    if (!formData.name.trim()) return showToast("error", "Nama lengkap wajib diisi.");
    if (!formData.email.trim()) return showToast("error", "Email wajib diisi.");
    if (!formData.roleId) return showToast("error", "Role wajib dipilih.");
    if (!formData.cabinetPeriod) return showToast("error", "Periode kabinet wajib dipilih.");
    
    if (formData.nim && !/^\d+$/.test(formData.nim)) {
      return showToast("error", "NIM harus berupa angka saja.");
    }

    try {
      setSaving(true);
      if (editingUser) {
        const payload: Partial<UserPayload> = {
          name: formData.name.trim(),
          nim: formData.nim.trim() || undefined,
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          position: formData.position.trim() || undefined,
          roleId: formData.roleId,
          department: formData.department || undefined,
          cabinetPeriod: formData.cabinetPeriod,
          isActive: formData.isActive,
        };
        await ImsApiService.updateUser(editingUser._id, payload);
        showToast("success", "Informasi user berhasil diperbarui.");
      } else {
        const payload: UserPayload = {
          name: formData.name.trim(),
          nim: formData.nim.trim() || undefined,
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          position: formData.position.trim() || undefined,
          roleId: formData.roleId,
          department: formData.department || undefined,
          cabinetPeriod: formData.cabinetPeriod,
          isActive: formData.isActive,
        };
        await ImsApiService.createUser(payload);
        showToast("success", "User baru berhasil dibuat.");
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      const errorObj = err as Error;
      const msg = errorObj.message || "Gagal menyimpan data user.";
      showToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  // DataTable column definitions memoized
  const columns = useMemo(() => [
    {
      header: "Avatar & Nama",
      accessor: (user: UserItem) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sage/10 border border-sage/20 flex items-center justify-center text-sage text-sm font-semibold overflow-hidden shrink-0">
            {user.avatar ? (
              <img 
                src={typeof user.avatar === "object" && user.avatar ? user.avatar.url : (user.avatar as string)} 
                alt={user.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
            )}
          </div>
          <div>
            <div className="font-semibold text-white text-sm">{user.name}</div>
            <div className="text-xs text-foreground/45">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      header: "NIM",
      accessor: (user: UserItem) => (
        <span className="text-foreground/80 font-mono text-xs">{user.nim || "-"}</span>
      )
    },
    {
      header: "Jabatan & Departemen",
      accessor: (user: UserItem) => (
        <div>
          <div className="text-xs font-medium text-white">{user.position || "-"}</div>
          <div className="text-[11px] text-foreground/50">{user.department?.name || "Struktural Inti"}</div>
        </div>
      )
    },
    {
      header: "Role",
      accessor: (user: UserItem) => {
        const roleName = user.role?.name || "User";
        const isSuperAdmin = user.role?.slug === "super-admin";
        const colorClass = isSuperAdmin 
          ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
          : "bg-sage/10 border-sage/20 text-sage";
        return <StatusBadge label={roleName} colorClass={colorClass} />;
      }
    },
    {
      header: "Kabinet",
      accessor: (user: UserItem) => {
        const cab = user.cabinetPeriod;
        const name = typeof cab === "object" && cab ? cab.name : (cab || "-");
        return <span className="text-xs text-foreground/60">{name}</span>;
      }
    },
    {
      header: "Status",
      accessor: (user: UserItem) => (
        <StatusBadge 
          label={user.isActive ? "Aktif" : "Nonaktif"} 
          colorClass={user.isActive 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }
        />
      )
    },
    {
      header: "Aksi",
      className: "text-right pr-6",
      accessor: (user: UserItem) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => openEditModal(user)}
            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
            title="Edit User"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(user)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              user.isActive 
                ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10" 
                : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            }`}
            title={user.isActive ? "Nonaktifkan" : "Aktifkan"}
          >
            {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ], [openEditModal, handleToggleStatus]);

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-6xl mx-auto w-full animate-fade-in pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Manajemen Akun</h1>
            <p className="text-foreground/60 text-sm mt-1">Kelola data akun pengurus, status aktif, dan peran masing-masing pengurus BEM</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-sage/90 transition-all duration-200 shadow-lg shadow-sage/20 border border-sage/50 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah User
          </button>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Toolbar Filters */}
        <div className="glass-subtle border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
            <input
              type="text"
              placeholder="Cari user (nama/email)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/5 rounded-xl text-sm outline-none text-white focus:border-sage/40 transition-all placeholder:text-foreground/25"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter Role */}
            <div className="flex items-center gap-2 bg-black/10 border border-white/5 rounded-xl px-3 py-1.5">
              <span className="text-xs text-foreground/40 font-medium">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="bg-transparent border-none text-xs text-white outline-none font-semibold cursor-pointer py-1"
              >
                <option value="all" className="bg-[#091c11] text-white">Semua</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id} className="bg-[#091c11] text-white">{r.name}</option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-2 bg-black/10 border border-white/5 rounded-xl px-3 py-1.5">
              <span className="text-xs text-foreground/40 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-transparent border-none text-xs text-white outline-none font-semibold cursor-pointer py-1"
              >
                <option value="all" className="bg-[#091c11] text-white">Semua</option>
                <option value="active" className="bg-[#091c11] text-white">Aktif</option>
                <option value="inactive" className="bg-[#091c11] text-white">Nonaktif</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-black/10 hover:bg-black/20 border border-white/5 text-foreground/75 hover:text-white rounded-xl transition-all duration-200 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={users}
          columns={columns}
          loading={loading}
          emptyMessage="Tidak ada user yang ditemukan"
          emptyIcon={<User className="w-8 h-8 text-foreground/30" />}
        />

        {/* Pagination Info */}
        {!loading && users.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <span className="text-xs text-foreground/40 font-medium">
              Menampilkan {users.length} dari {totalItems} user
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-black/20 hover:bg-black/30 disabled:opacity-30 border border-white/5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Sebelumnya
              </button>
              <span className="text-xs text-foreground/60 px-2">
                Halaman {page} dari {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-black/20 hover:bg-black/30 disabled:opacity-30 border border-white/5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}

        {/* Create/Edit Modal Dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
              onClick={() => !saving && setIsModalOpen(false)} 
            />
            <div className="glass-active border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 animate-scale-in max-h-[90vh] flex flex-col">
              
              <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
                <h2 className="text-xl font-bold text-white">
                  {editingUser ? "Edit User" : "Tambah User"}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={saving}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-foreground/60 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
                <FormInput
                  label="Nama Lengkap"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama lengkap pengurus..."
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="NIM"
                    name="nim"
                    value={formData.nim}
                    onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                    placeholder="NIM pengurus..."
                  />
                  <FormInput
                    label="Email (akademik/unesa)"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="bemft@unesa.ac.id"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Nomor HP / WhatsApp"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812xxxxxxxx"
                  />
                  <FormInput
                    label="Jabatan"
                    name="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Misal: Ketua / Staf"
                  />
                </div>

                <FormSelect
                  label="Peran (Role)"
                  name="roleId"
                  value={formData.roleId}
                  onChange={(val) => setFormData({ ...formData, roleId: val })}
                  options={roles.map((r) => ({ value: r._id, label: r.name }))}
                  placeholder="Pilih Peran..."
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect
                    label="Departemen"
                    name="department"
                    value={formData.department}
                    onChange={(val) => setFormData({ ...formData, department: val })}
                    options={[
                      { value: "", label: "Struktural Inti (Non-departemen)" },
                      ...departments.map((d) => ({ value: d._id, label: d.code || d.name }))
                    ]}
                    placeholder="Pilih Departemen..."
                  />
                  <FormSelect
                    label="Periode Kabinet"
                    name="cabinetPeriod"
                    value={formData.cabinetPeriod}
                    onChange={(val) => setFormData({ ...formData, cabinetPeriod: val })}
                    options={cabinetPeriods.map((c) => ({ value: c._id, label: c.name }))}
                    placeholder="Pilih Kabinet..."
                    required
                  />
                </div>

                {editingUser && (
                  <div className="flex items-center gap-3 bg-black/10 p-3 rounded-xl border border-white/5">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 accent-sage cursor-pointer rounded"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-white cursor-pointer select-none">
                      Akun Pengurus Aktif
                    </label>
                  </div>
                )}

                <div className="pt-4 border-t border-white/5 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl hover:bg-white/5 text-sm font-medium transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-sage text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-sage/90 disabled:opacity-50 transition-colors shadow-lg shadow-sage/20 border border-sage/50 flex items-center gap-2 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
