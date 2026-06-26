"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { ImsApiService } from "@/lib/api";
import { FormInput } from "@/components/ui";
import { Plus, Pencil, Trash2, X, AlertCircle } from "lucide-react";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await ImsApiService.getDepartments();
      setDepartments(res.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal memuat data departemen.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", code: "", description: "" });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: any) => {
    setEditingId(dept._id);
    setFormData({ name: dept.name, code: dept.code || "", description: dept.description || "" });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus departemen ini?")) return;
    try {
      setErrorMsg(null);
      await ImsApiService.deleteDepartment(id);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menghapus departemen.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      if (editingId) {
        await ImsApiService.updateDepartment(editingId, formData);
      } else {
        await ImsApiService.createDepartment(formData);
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menyimpan departemen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-6xl mx-auto w-full animate-fade-in pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Departemen</h1>
            <p className="text-foreground/60 text-sm mt-1">Kelola departemen/biro BEM FT UNESA</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-sage text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-sage/90 transition-all duration-200 shadow-lg shadow-sage/20 border border-sage/50"
          >
            <Plus className="w-4 h-4" /> Tambah Departemen
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Table Container */}
        <div className="glass-subtle border border-white/5 rounded-2xl overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-sm text-foreground/70">
                  <th className="p-4 font-medium pl-6">Nama Departemen</th>
                  <th className="p-4 font-medium">Singkatan</th>
                  <th className="p-4 font-medium text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-foreground/50">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
                        <span className="text-sm">Memuat departemen...</span>
                      </div>
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-foreground/50">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                          <Plus className="w-6 h-6 text-foreground/40" />
                        </div>
                        <span className="text-sm">Belum ada data departemen</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => (
                    <tr key={dept._id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-4 pl-6 align-top">
                        <div className="font-medium text-white mb-1">{dept.name}</div>
                        <div className="text-sm text-foreground/60 line-clamp-2 max-w-lg">{dept.description}</div>
                      </td>
                      <td className="p-4 align-top">
                        {dept.code ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/10">
                            {dept.code}
                          </span>
                        ) : (
                          <span className="text-foreground/40">-</span>
                        )}
                      </td>
                      <td className="p-4 pr-6 align-top">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(dept)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(dept._id)}
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => !saving && setIsModalOpen(false)} />
            <div className="glass-panel border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 animate-scale-in">
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">
                  {editingId ? "Edit Departemen" : "Tambah Departemen"}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-foreground/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <FormInput
                  label="Nama Departemen"
                  name="dept-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Misal: Departemen Pengembangan Sumber Daya Mahasiswa"
                  required
                />
                
                <FormInput
                  label="Singkatan (Kode)"
                  name="dept-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Misal: PSDM"
                />
                
                <div className="space-y-2">
                  <label htmlFor="dept-desc" className="text-sm font-medium text-foreground/90 block">Deskripsi</label>
                  <textarea
                    id="dept-desc"
                    className="w-full bg-black/20 border border-white/10 focus:border-sage/50 rounded-xl px-4 py-3 min-h-[100px] outline-none transition-all placeholder:text-foreground/30 text-sm resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Jelaskan peran dan fungsi departemen ini secara singkat..."
                  />
                </div>
                
                <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl hover:bg-white/5 text-sm font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-sage text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-sage/90 disabled:opacity-50 transition-colors shadow-lg shadow-sage/20 border border-sage/50 flex items-center gap-2"
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
