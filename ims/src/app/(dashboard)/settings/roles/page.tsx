"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import { ImsApiService, RoleItem, PermissionItem } from "@/lib/api";
import { FormInput, DataTable, StatusBadge } from "@/components/ui";
import { 
  Plus, 
  RefreshCw, 
  Pencil, 
  Trash2, 
  AlertCircle, 
  X, 
  CheckCircle,
  Shield,
  Check
} from "lucide-react";

// Grouping permissions for clear UI mapping
const PERMISSION_GROUPS = [
  {
    title: "User Management",
    resource: "user",
    permissions: [
      { name: "user:read", label: "View Users" },
      { name: "user:create", label: "Create User" },
      { name: "user:update", label: "Update User" },
      { name: "user:delete", label: "Deactivate User" },
    ]
  },
  {
    title: "Role & Access",
    resource: "role",
    permissions: [
      { name: "role:read", label: "View Roles" },
      { name: "role:create", label: "Create Role" },
      { name: "role:update", label: "Update Role" },
      { name: "role:delete", label: "Delete Role" },
    ]
  },
  {
    title: "Departments",
    resource: "department",
    permissions: [
      { name: "department:read", label: "View Departments" },
      { name: "department:create", label: "Create Department" },
      { name: "department:update", label: "Update Department" },
      { name: "department:delete", label: "Delete Department" },
    ]
  },
  {
    title: "Content & Berita",
    resource: "content",
    permissions: [
      { name: "content:read", label: "View Articles" },
      { name: "content:create", label: "Create Article" },
      { name: "content:update", label: "Update Article" },
      { name: "content:publish", label: "Publish / Archive" },
      { name: "content:delete", label: "Delete Article" },
    ]
  },
  {
    title: "Events",
    resource: "event",
    permissions: [
      { name: "event:read", label: "View Events" },
      { name: "event:create", label: "Create Event" },
      { name: "event:update", label: "Update Event" },
      { name: "event:publish", label: "Publish / Archive" },
      { name: "event:delete", label: "Delete Event" },
    ]
  },
  {
    title: "Media Library",
    resource: "media",
    permissions: [
      { name: "media:read", label: "Browse Media" },
      { name: "media:create", label: "Upload Files" },
      { name: "media:update", label: "Edit Metadata" },
      { name: "media:delete", label: "Delete Files" },
    ]
  },
  {
    title: "Navigation Menus",
    resource: "menu",
    permissions: [
      { name: "menu:read", label: "View Menus" },
      { name: "menu:create", label: "Create Menu" },
      { name: "menu:update", label: "Update Menu" },
      { name: "menu:delete", label: "Delete Menu" },
    ]
  },
  {
    title: "Sponsors & Partners",
    resource: "partners",
    permissions: [
      { name: "partners:read", label: "View Partners" },
      { name: "partners:create", label: "Add Partner" },
      { name: "partners:update", label: "Edit Partner" },
      { name: "partners:delete", label: "Delete Partner" },
    ]
  },
  {
    title: "Open Recruitment",
    resource: "recruitment",
    permissions: [
      { name: "recruitment:read", label: "View Oprec" },
      { name: "recruitment:create", label: "Create Oprec" },
      { name: "recruitment:update", label: "Edit Oprec" },
      { name: "recruitment:publish", label: "Open / Close" },
      { name: "recruitment:delete", label: "Delete Oprec" },
    ]
  },
  {
    title: "Galeri & Media",
    resource: "gallery",
    permissions: [
      { name: "gallery:read", label: "View Gallery" },
      { name: "gallery:create", label: "Create Album" },
      { name: "gallery:update", label: "Edit Album" },
      { name: "gallery:publish", label: "Publish Album" },
      { name: "gallery:delete", label: "Delete Album" },
    ]
  },
  {
    title: "System & Audit Trail",
    resource: "settings_audit",
    permissions: [
      { name: "settings:read", label: "View Settings" },
      { name: "settings:update", label: "Update Settings" },
      { name: "audit:read", label: "View Audit Logs" },
    ]
  }
];

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    selectedPermissions: [] as string[],
  });

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Alert & toast helper
  const showToast = useCallback((type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  }, []);

  // Fetch Roles list
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await ImsApiService.getRoles();
      setRoles(res.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal memuat data peran (role) dari server.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Run initial roles fetch deferred to prevent synchronous setState lint issues
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRoles();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchRoles]);

  const handleRefresh = () => {
    fetchRoles();
    showToast("success", "Daftar peran berhasil diperbarui.");
  };

  // Helper to slugify name
  const handleNameChange = (nameVal: string) => {
    const slugVal = nameVal
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    setFormData(prev => ({
      ...prev,
      name: nameVal,
      slug: prev.slug === "" || prev.slug === prev.name.toLowerCase().replace(/[\s_-]+/g, "-") ? slugVal : prev.slug
    }));
  };

  // Open modal for creating a new role
  const openAddModal = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      selectedPermissions: [],
    });
    setIsModalOpen(true);
  };

  // Open modal for editing an existing role
  const openEditModal = useCallback((role: RoleItem) => {
    setEditingRole(role);
    
    // Map populated permissions to name strings
    const permissionNames = role.permissions.map((p: string | PermissionItem) => {
      if (typeof p === "string") return p;
      return p.name || "";
    }).filter(Boolean);

    setFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || "",
      selectedPermissions: permissionNames,
    });
    setIsModalOpen(true);
  }, []);

  // Delete role
  const handleDeleteRole = useCallback(async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus peran "${name}"?`)) return;
    try {
      setLoading(true);
      await ImsApiService.deleteRole(id);
      
      // Update locally
      setRoles((prevRoles) => prevRoles.filter((r) => r._id !== id));
      showToast("success", "Peran berhasil dihapus.");
    } catch (err) {
      console.error(err);
      const errorObj = err as Error;
      const msg = errorObj.message || "Gagal menghapus peran. Pastikan tidak ada user yang dikaitkan dengan peran ini.";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Handle checking / unchecking permission checkboxes
  const handlePermissionToggle = (permName: string) => {
    setFormData((prev) => {
      const alreadySelected = prev.selectedPermissions.includes(permName);
      const updated = alreadySelected
        ? prev.selectedPermissions.filter((name) => name !== permName)
        : [...prev.selectedPermissions, permName];
      return { ...prev, selectedPermissions: updated };
    });
  };

  // Toggle all permissions inside a specific group card
  const handleToggleGroup = (groupPerms: { name: string }[]) => {
    const groupPermNames = groupPerms.map((p) => p.name);
    const allSelected = groupPermNames.every((name) => formData.selectedPermissions.includes(name));

    setFormData((prev) => {
      let updated: string[];
      if (allSelected) {
        // Uncheck all in this group
        updated = prev.selectedPermissions.filter((name) => !groupPermNames.includes(name));
      } else {
        // Check all in this group (avoid duplicates)
        const withoutGroup = prev.selectedPermissions.filter((name) => !groupPermNames.includes(name));
        updated = [...withoutGroup, ...groupPermNames];
      }
      return { ...prev, selectedPermissions: updated };
    });
  };

  // Check if all permissions in a group are selected
  const isGroupFullySelected = (groupPerms: { name: string }[]) => {
    const groupPermNames = groupPerms.map((p) => p.name);
    return groupPermNames.every((name) => formData.selectedPermissions.includes(name));
  };

  // Handle form submit (Create or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return showToast("error", "Nama peran wajib diisi.");
    if (!formData.slug.trim()) return showToast("error", "Slug peran wajib diisi.");

    try {
      setSaving(true);
      const payload: Partial<RoleItem> = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        permissions: formData.selectedPermissions,
      };

      if (editingRole) {
        await ImsApiService.updateRole(editingRole._id, payload);
        showToast("success", "Peran berhasil diperbarui.");
      } else {
        await ImsApiService.createRole(payload);
        showToast("success", "Peran baru berhasil dibuat.");
      }

      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      console.error(err);
      const errorObj = err as Error;
      const msg = errorObj.message || "Gagal menyimpan peran.";
      showToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  // DataTable column definitions memoized
  const columns = useMemo(() => [
    {
      header: "Nama Peran",
      accessor: (role: RoleItem) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sage/10 border border-sage/20 flex items-center justify-center text-sage shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">{role.name}</div>
            <div className="text-[11px] text-foreground/45 max-w-sm line-clamp-1">{role.description || "Tidak ada deskripsi"}</div>
          </div>
        </div>
      )
    },
    {
      header: "Slug",
      accessor: (role: RoleItem) => (
        <span className="text-foreground/80 font-mono text-xs bg-black/10 px-2 py-1 rounded border border-white/5">{role.slug}</span>
      )
    },
    {
      header: "Jumlah Hak Akses",
      accessor: (role: RoleItem) => (
        <span className="text-xs text-foreground/70 font-semibold">{role.permissions?.length || 0} Izin</span>
      )
    },
    {
      header: "Tipe Peran",
      accessor: (role: RoleItem) => (
        <StatusBadge 
          label={role.isSystem ? "Bawaan Sistem" : "Kustom"} 
          colorClass={role.isSystem 
            ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
            : "bg-sage/10 border-sage/20 text-sage"
          }
        />
      )
    },
    {
      header: "Aksi",
      className: "text-right pr-6",
      accessor: (role: RoleItem) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => openEditModal(role)}
            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
            title="Edit Peran"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteRole(role._id, role.name)}
            disabled={role.isSystem}
            className={`p-1.5 rounded-lg transition-colors ${
              role.isSystem 
                ? "text-foreground/20 cursor-not-allowed" 
                : "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
            }`}
            title={role.isSystem ? "Peran sistem tidak bisa dihapus" : "Hapus Peran"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ], [openEditModal, handleDeleteRole]);

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-6xl mx-auto w-full animate-fade-in pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Role & Access Management</h1>
            <p className="text-foreground/60 text-sm mt-1">Buat peran kustom untuk pengurus dan kelola set izin fungsional masing-masing peran secara granular</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-sage/90 transition-all duration-200 shadow-lg shadow-sage/20 border border-sage/50 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Peran
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

        {/* Toolbar */}
        <div className="flex justify-end pr-2 shrink-0">
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-black/10 hover:bg-black/20 border border-white/5 text-foreground/75 hover:text-white rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang Data
          </button>
        </div>

        {/* Roles Table */}
        <DataTable
          data={roles}
          columns={columns}
          loading={loading}
          emptyMessage="Tidak ada peran yang ditemukan"
          emptyIcon={<Shield className="w-8 h-8 text-foreground/30" />}
        />

        {/* Create/Edit Modal Dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
              onClick={() => !saving && setIsModalOpen(false)} 
            />
            <div className="glass-active border border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl relative z-10 animate-scale-in max-h-[90vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
                <h2 className="text-xl font-bold text-white">
                  {editingRole ? `Edit Peran: ${editingRole.name}` : "Tambah Peran Baru"}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={saving}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-foreground/60 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
                
                {/* Basic Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Nama Peran"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Misal: Staff Website"
                    required
                  />
                  <FormInput
                    label="Slug (Identifikasi Sistem)"
                    name="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Misal: staff-website"
                    required
                    helperText="Slug digunakan sistem untuk hak akses tingkat kode. Sebaiknya gunakan karakter huruf kecil dan strip (-)."
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-foreground/70 block">Deskripsi Peran</label>
                  <textarea
                    id="description"
                    className="w-full bg-black/20 border border-white/10 focus:border-sage/40 rounded-xl px-4 py-3 min-h-[70px] outline-none transition-all placeholder:text-foreground/25 text-sm resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Rincian wewenang atau tugas peran ini..."
                  />
                </div>

                {/* Permission Grid Title */}
                <div className="pt-4 border-t border-white/5">
                  <h3 className="text-sm font-semibold text-white mb-2">Grid Hak Akses (Permissions Grid)</h3>
                  <p className="text-xs text-foreground/50 mb-4">Centang izin operasional spesifik yang ingin diberikan pada peran ini</p>
                  
                  {/* Grid Container */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PERMISSION_GROUPS.map((group) => {
                      const fullyChecked = isGroupFullySelected(group.permissions);
                      return (
                        <div 
                          key={group.resource} 
                          className="glass-subtle border border-white/5 rounded-2xl p-4 flex flex-col hover:border-white/10 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                            <span className="text-xs font-bold text-white tracking-wide uppercase">{group.title}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleGroup(group.permissions)}
                              className="text-[10px] text-sage hover:text-sage/80 font-bold uppercase tracking-wider cursor-pointer"
                            >
                              {fullyChecked ? "Kosongkan" : "Pilih Semua"}
                            </button>
                          </div>
                          
                          <div className="space-y-2.5 flex-1">
                            {group.permissions.map((perm) => {
                              const checked = formData.selectedPermissions.includes(perm.name);
                              return (
                                <label 
                                  key={perm.name} 
                                  className="flex items-center gap-2.5 text-xs text-foreground/70 hover:text-white cursor-pointer select-none py-0.5"
                                >
                                  <div className="relative flex items-center justify-center shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => handlePermissionToggle(perm.name)}
                                      className="sr-only"
                                    />
                                    <div className={`w-4 h-4 rounded border transition-all duration-150 flex items-center justify-center ${
                                      checked 
                                        ? "bg-sage border-sage text-white" 
                                        : "border-white/10 bg-black/20 hover:border-sage/40"
                                    }`}>
                                      {checked && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                                    </div>
                                  </div>
                                  <span className="font-medium">{perm.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="pt-6 border-t border-white/5 flex justify-end gap-3 shrink-0">
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
