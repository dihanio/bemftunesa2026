"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { apiClient } from '@/shared/api/axios';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { LoadingState } from '@/components/ui/loading-state';

interface PermissionItem {
  _id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

interface RoleItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isSystem: boolean;
  permissions: PermissionItem[];
}

export default function RolesManagementPage() {
  const toast = useToast();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        apiClient.get('/pkkmb/roles'),
        apiClient.get('/pkkmb/permissions'),
      ]);
      setRoles(rolesRes.data?.data || []);
      setAllPermissions(permsRes.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data role dan permission.', 'ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRoleId(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: RoleItem) => {
    setEditingRoleId(role._id);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    const currentPermIds = role.permissions.map((p) => p._id);
    setSelectedPermIds(currentPermIds);
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permId: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error('Nama Role wajib diisi.', 'VALIDASI GAGAL');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRoleId) {
        await apiClient.patch(`/pkkmb/roles/${editingRoleId}`, {
          name: roleName,
          description: roleDescription,
          permissions: selectedPermIds,
        });
        toast.success(`Role '${roleName}' berhasil diperbarui!`, 'SUKSES');
      } else {
        await apiClient.post('/pkkmb/roles', {
          name: roleName,
          description: roleDescription,
          permissions: selectedPermIds,
        });
        toast.success(`Role baru '${roleName}' berhasil dibuat!`, 'SUKSES');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Gagal menyimpan role.', 'GAGAL');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: RoleItem) => {
    if (role.isSystem) {
      toast.error('Role sistem bawaan tidak dapat dihapus.', 'AKSES DITOLAK');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus role '${role.name}'?`)) return;

    try {
      await apiClient.delete(`/pkkmb/roles/${role._id}`);
      toast.success(`Role '${role.name}' berhasil dihapus.`, 'SUKSES');
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Gagal menghapus role.', 'GAGAL');
    }
  };

  // Group permissions by resource for clean UI check-boxes
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const resKey = perm.resource.toUpperCase();
    if (!acc[resKey]) acc[resKey] = [];
    acc[resKey].push(perm);
    return acc;
  }, {} as Record<string, PermissionItem[]>);

  if (isLoading) {
    return <LoadingState message="Memuat manajemen role & permission..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--border-subtle)]">
        <div className="p-3 bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded-lg text-[var(--accent)] shrink-0">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
            MANAJEMEN ROLE & HAK AKSES (PERMISSIONS)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
            Atur role dinamis dan penugasan permission sistem secara terpusat untuk Portal PKKMB FT UNESA 2026.
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-[var(--text-secondary)]">
          Total Role Terdaftar: <span className="text-[var(--accent)] font-bold">{roles.length}</span>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="btn-accent px-5 py-2.5 font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Role Baru</span>
        </button>
      </div>

      {/* Role Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <div key={role._id} className="surface-card p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold font-mono text-[var(--text-primary)] uppercase flex items-center gap-2">
                  {role.name}
                  {role.isSystem && (
                    <span className="px-2 py-0.5 text-[9px] font-mono text-[var(--accent)] bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded flex items-center gap-1">
                      <Lock className="h-3 w-3" /> ROLE SISTEM
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)] bg-white/5 px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                  SLUG: {role.slug}
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {role.description || 'Tidak ada deskripsi.'}
              </p>

              {/* Granted Permissions Badges */}
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Permission Diberikan ({role.permissions.length}):
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                  {role.permissions.map((perm) => (
                    <span
                      key={perm._id || perm.name}
                      className="px-2 py-0.5 text-[9px] font-mono text-[var(--text-primary)] bg-white/5 border border-[var(--border-subtle)] rounded flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5 text-[var(--accent)]" /> {perm.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Role Actions */}
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleOpenEditModal(role)}
                className="px-3 py-1.5 text-xs font-mono text-[var(--accent)] hover:bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded transition-all flex items-center gap-1.5 cursor-pointer font-bold uppercase"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Permission
              </button>
              {!role.isSystem && (
                <button
                  type="button"
                  onClick={() => handleDeleteRole(role)}
                  className="px-3 py-1.5 text-xs font-mono text-[var(--semantic-danger)] hover:bg-red-500/10 border border-red-500/30 rounded transition-all flex items-center gap-1.5 cursor-pointer font-bold uppercase"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Role Creation / Editing Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoleId ? `EDIT PERMISSION: ${roleName}` : 'BUAT ROLE DINAMIS BARU'}
        description="Atur nama role dan centang permission yang diizinkan untuk role ini."
        maxWidth="xl"
      >
        <form onSubmit={handleSaveRole} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
              Nama Role *
            </label>
            <input
              type="text"
              required
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Contoh: Panitia Dokumentasi / Sie Konsumsi"
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
              Deskripsi Tugas / Role
            </label>
            <input
              type="text"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder="Jelaskan wewenang dan tanggung jawab role ini..."
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Permissions Selection Checklist Grouped by Resource */}
          <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
            <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
              Daftar Permission Sistem ({selectedPermIds.length} Terpilih) *
            </label>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-2">
              {Object.entries(groupedPermissions).map(([resGroup, perms]) => (
                <div
                  key={resGroup}
                  className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-lg space-y-2"
                >
                  <div className="text-[10px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider border-b border-white/5 pb-1">
                    RESOURCE: {resGroup}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map((perm) => {
                      const isChecked = selectedPermIds.includes(perm._id);

                      return (
                        <label
                          key={perm._id}
                          className={`p-2 rounded border flex items-start gap-2.5 cursor-pointer transition-all ${
                            isChecked
                              ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--text-primary)]'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-default)]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(perm._id)}
                            className="mt-0.5 accent-[var(--accent)] cursor-pointer"
                          />
                          <div>
                            <div className="text-xs font-mono font-bold text-[var(--accent)]">
                              {perm.name}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">
                              {perm.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)] font-mono text-xs uppercase tracking-wider rounded transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 btn-accent font-mono text-xs uppercase tracking-wider flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Simpan Perubahan Role</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
