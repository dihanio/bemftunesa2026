"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService, { type StructureData } from "@/lib/api";
import { Network, Users, Plus, Trash2, X, AlertCircle } from "lucide-react";
import { FormInput } from "@/components/ui/FormInput";
import { FormSelect } from "@/components/ui/FormSelect";

export default function StructurePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StructureData | null>(null);

  interface UserItem {
    _id: string;
    name: string;
    email: string;
  }
  const [users, setUsers] = useState<UserItem[]>([]);
  
  // Modal states
  type ModalMode = 'bpi' | 'department' | null;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [selectedUserId, setSelectedUserId] = useState("");
  const [bpiRoleSlug, setBpiRoleSlug] = useState("kabem");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [position, setPosition] = useState("Staff");
  
  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchStructure();
    fetchUsers();
  }, []);

  const fetchStructure = async () => {
    try {
      setLoading(true);
      const res = await ImsApiService.getStructure();
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await ImsApiService.getUsers();
      if (res.data && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        const responseData = res.data as unknown as { items: UserItem[] };
        if (responseData && Array.isArray(responseData.items)) {
          setUsers(responseData.items);
        }
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      showNotification('error', 'Silakan pilih user terlebih dahulu');
      return;
    }

    try {
      setIsSubmitting(true);
      if (modalMode === "bpi") {
        await ImsApiService.assignToBPI(selectedUserId, bpiRoleSlug);
      } else if (modalMode === "department") {
        if (!selectedDeptId) {
          showNotification('error', 'Silakan pilih departemen');
          setIsSubmitting(false);
          return;
        }
        await ImsApiService.assignToDepartment(selectedUserId, selectedDeptId, position);
      }
      
      showNotification('success', 'Anggota berhasil ditambahkan');
      setIsModalOpen(false);
      resetForm();
      await fetchStructure();
    } catch (err: unknown) {
      const error = err as Error;
      showNotification('error', error.message || 'Gagal menambahkan anggota');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${name} dari struktur?`)) return;
    
    try {
      setLoading(true);
      await ImsApiService.removeStructureMember(userId);
      showNotification('success', 'Anggota berhasil dihapus');
      await fetchStructure();
    } catch (err: unknown) {
      const error = err as Error;
      showNotification('error', error.message || 'Gagal menghapus anggota');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUserId("");
    setBpiRoleSlug("kabem");
    setSelectedDeptId("");
    setPosition("Staff");
  };

  const openBpiModal = () => {
    resetForm();
    setModalMode("bpi");
    setIsModalOpen(true);
  };

  const openDeptModal = (deptId: string) => {
    resetForm();
    setSelectedDeptId(deptId);
    setModalMode("department");
    setIsModalOpen(true);
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-6xl mx-auto w-full animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <Network className="w-6 h-6 text-sage" />
              Struktur Organisasi
            </h1>
            <p className="text-foreground/60 text-sm mt-1">Kelola anggota dan bagan kepengurusan BEM FT UNESA</p>
          </div>
        </div>

        {/* Global Notifications */}
        {notification && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{notification.message}</p>
          </div>
        )}

        {/* BPI Section (Badan Pengurus Inti) */}
        <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h2 className="text-lg font-semibold text-white">Badan Pengurus Inti (BPI)</h2>
            <button onClick={openBpiModal} className="flex items-center gap-1.5 bg-sage text-white hover:bg-sage/90 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-sage/20 border border-sage/50">
              <Plus className="w-3.5 h-3.5" /> Tambah Pengurus
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading && !data ? (
              <div className="col-span-full py-12 text-center flex flex-col items-center">
                <div className="w-8 h-8 animate-spin rounded-full border-4 border-sage/20 border-t-sage mb-3" />
                <span className="text-sm text-foreground/50">Memuat struktur...</span>
              </div>
            ) : data?.bpi && data.bpi.length > 0 ? (
              data.bpi.map((member) => (
                <div key={member._id} className="bg-black/20 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors group relative">
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button 
                      onClick={() => handleRemoveMember(member._id, member.name)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors" 
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="w-16 h-16 rounded-full bg-sage/10 border border-sage/20 flex items-center justify-center text-sage text-xl font-bold mb-4 mx-auto overflow-hidden relative">
                    {member.avatar ? (
                      <Image src={member.avatar} alt={member.name} fill className="w-full h-full object-cover" />
                    ) : (
                      member.name.charAt(0)
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-white text-sm line-clamp-1">{member.name}</h3>
                    <p className="text-xs text-sage mt-1 font-medium">{member.role}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-foreground/50 text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 text-foreground/30" />
                Belum ada data Pengurus Inti.
              </div>
            )}
          </div>
        </div>

        {/* Departemen Section */}
        <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden p-6 sm:p-8 mt-8">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h2 className="text-lg font-semibold text-white">Departemen & Biro</h2>
          </div>
          
          {loading && !data ? (
             <div className="py-12 text-center flex flex-col items-center">
               <div className="w-8 h-8 animate-spin rounded-full border-4 border-sage/20 border-t-sage mb-3" />
               <span className="text-sm text-foreground/50">Memuat departemen...</span>
             </div>
          ) : data?.departments && data.departments.length > 0 ? (
            <div className="space-y-6">
              {data.departments.map((dept) => {
                const deptMembers = data.members?.filter((m) => m.departmentId === dept._id) || [];
                return (
                  <div key={dept._id} className="bg-black/20 border border-white/5 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-white">{dept.name} {dept.code ? `(${dept.code})` : ''}</h3>
                        <span className="text-xs px-2.5 py-1 bg-white/5 text-foreground/70 rounded-full border border-white/10">
                          {deptMembers.length} Anggota
                        </span>
                      </div>
                      <button onClick={() => openDeptModal(dept._id)} className="flex items-center gap-1.5 bg-sage/10 text-sage hover:bg-sage/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Tambah Anggota
                      </button>
                    </div>
                    
                    {deptMembers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {deptMembers.map((member) => (
                          <div key={member._id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 group hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center text-sage font-bold overflow-hidden relative">
                                {member.avatar ? (
                                  <Image src={member.avatar} alt={member.name} fill className="w-full h-full object-cover" />
                                ) : (
                                  member.name.charAt(0)
                                )}
                              </div>
                              <div>
                                <p className="text-sm text-white font-medium">{member.name}</p>
                                <p className="text-xs text-foreground/60">{member.role}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleRemoveMember(member._id, member.name)}
                              className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors opacity-0 group-hover:opacity-100" 
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-foreground/50 italic py-4 text-center border border-dashed border-white/10 rounded-lg">
                        Belum ada anggota di departemen ini.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-foreground/50 text-sm">
              Belum ada data Departemen. Silakan tambahkan di menu Departemen.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="glass-panel border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 animate-scale-in">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {modalMode === 'bpi' ? 'Tambah Pengurus Inti' : 'Tambah Anggota Departemen'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-foreground/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddMember} className="p-6 space-y-5">
              
              <div className="space-y-1.5">
                <FormSelect 
                  label="Pilih User"
                  name="userId"
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                  options={users.map(u => ({ value: u._id, label: `${u.name} (${u.email})` }))}
                  placeholder="-- Pilih Anggota Terdaftar --"
                  required
                />
                <p className="text-xs text-foreground/50 mt-1">User harus sudah terdaftar di sistem.</p>
              </div>

              {modalMode === "bpi" ? (
                <div className="animate-fade-in">
                  <FormSelect 
                    label="Pilih Jabatan BPI"
                    name="bpiRoleSlug"
                    value={bpiRoleSlug}
                    onChange={setBpiRoleSlug}
                    options={[
                      { value: 'kabem', label: 'Ketua BEM' },
                      { value: 'wakabem', label: 'Wakil Ketua BEM' },
                      { value: 'sekretaris', label: 'Sekretaris' },
                      { value: 'bendahara', label: 'Bendahara' }
                    ]}
                    required
                  />
                </div>
              ) : modalMode === "department" ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white">Departemen</label>
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-foreground/70 text-sm">
                      {data?.departments?.find(d => d._id === selectedDeptId)?.name}
                    </div>
                  </div>
                  
                  <FormSelect 
                    label="Posisi / Jabatan"
                    name="position"
                    value={position}
                    onChange={setPosition}
                    options={[
                      { value: 'Ketua Departemen', label: 'Ketua Departemen' },
                      { value: 'Wakil Ketua Departemen', label: 'Wakil Ketua Departemen' },
                      { value: 'Staff', label: 'Staff' }
                    ]}
                    required
                  />
                </div>
              ) : null}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-sage hover:bg-sage/90 text-white text-sm font-medium transition-colors shadow-lg shadow-sage/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Anggota'
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
