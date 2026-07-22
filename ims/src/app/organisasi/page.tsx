"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService from "@/lib/api";
import { Landmark, Plus, Edit2, X } from "lucide-react";

interface OrgItem {
  _id: string;
  name: string;
  period: string;
  vision?: string;
  missions?: string[];
  isActive: boolean;
  createdAt: string;
}

export default function OrganisasiPage() {
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const dialogRef = React.useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (showModal) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [showModal]);

  // Form
  const [formName, setFormName] = useState("");
  const [formPeriod, setFormPeriod] = useState("");
  const [formVision, setFormVision] = useState("");
  const [formMissions, setFormMissions] = useState("");

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ImsApiService.getOrganizations<OrgItem>();
      if (res.success && res.data) setOrgs(res.data);
    } catch (err) {
      console.error("Gagal memuat data organisasi:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrgs();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrgs]);

  const resetForm = () => {
    setFormName(""); setFormPeriod(""); setFormVision(""); setFormMissions("");
    setEditingId(null);
  };

  const openEdit = (org: OrgItem) => {
    setEditingId(org._id);
    setFormName(org.name);
    setFormPeriod(org.period);
    setFormVision(org.vision || "");
    setFormMissions((org.missions || []).join("\n"));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName || !formPeriod) return;
    const missions = formMissions.split("\n").map(s => s.trim()).filter(Boolean);
    try {
      if (editingId) {
        await ImsApiService.updateOrganization(editingId, { name: formName, period: formPeriod, vision: formVision, missions });
      } else {
        await ImsApiService.createOrganization({ name: formName, period: formPeriod, vision: formVision, missions });
      }
      setShowModal(false);
      resetForm();
      fetchOrgs();
    } catch (err) {
      console.error("Gagal menyimpan organisasi:", err);
    }
  };

  return (
    <DashboardShell allowedRoles={['super-admin', 'kabem', 'wakabem', 'sekretaris', 'sekretaris-umum', 'sekretaris-administrasi', 'sekretaris-kegiatan']}>
      <div className="w-full max-w-4xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hairline pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-ink tracking-tight m-0">
              Periode Kabinet
            </h1>
            <p className="text-sm text-ink-subtle mt-1">
              Kelola data organisasi BEM FT per periode kepengurusan
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="fixed bottom-6 right-6 z-40 md:static md:bottom-auto md:right-auto bg-primary hover:bg-primary-hover text-on-primary font-medium py-3 px-6 md:py-2.5 md:px-5 rounded-md md:rounded-lg text-sm flex items-center gap-2 transition-all active:scale-95 md: border border-primary-focus"
          >
            <Plus size={18} className="md:w-4 md:h-4" /> Tambah Periode
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 animate-spin rounded-full border-4 border-surface-3 border-t-primary" />
            <span className="text-sm text-ink-muted">Memuat data...</span>
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center p-[60px] text-ink-muted bg-surface-1 rounded-xl border border-dashed border-hairline">
            <Landmark size={40} className="mb-3 opacity-40 mx-auto" />
            <p className="m-0 font-semibold text-sm">Belum ada data periode</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orgs.map(org => (
              <div key={org._id} className={`bg-surface-1 rounded-xl p-5 border ${org.isActive ? "border-primary/40 bg-primary/5" : "border-hairline"}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-ink">
                        {org.name}
                      </span>
                      {org.isActive && (
                        <span className="text-[10px] font-bold py-0.5 px-2 rounded-full bg-semantic-success/15 text-semantic-success border border-semantic-success/20">AKTIF</span>
                      )}
                    </div>
                    <div className="text-sm text-ink-muted mt-1">
                      Periode: {org.period}
                    </div>
                  </div>
                  <button onClick={() => openEdit(org)} className="bg-surface-2 hover:bg-surface-3 text-ink-subtle hover:text-ink border border-hairline rounded-md p-2 cursor-pointer transition-colors">
                    <Edit2 size={14} />
                  </button>
                </div>

                {org.vision && (
                  <div className="mt-4 pt-4 border-t border-hairline">
                    <span className="text-[11px] font-bold text-ink-muted uppercase tracking-[0.5px]">Visi</span>
                    <p className="text-[13px] text-ink mt-1.5 leading-relaxed">{org.vision}</p>
                  </div>
                )}

                {org.missions && org.missions.length > 0 && (
                  <div className="mt-4">
                    <span className="text-[11px] font-bold text-ink-muted uppercase tracking-[0.5px]">Misi</span>
                    <ol className="mt-1.5 pl-4 text-[13px] text-ink leading-relaxed">
                      {org.missions.map((m, i) => <li key={i}>{m}</li>)}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <dialog
        ref={dialogRef}
        onClose={() => { setShowModal(false); resetForm(); }}
        onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); resetForm(); } }}
        className="bg-surface-1 border border-hairline-strong rounded-xl w-full max-w-lg overflow-hidden bg-surface-1 p-0 backdrop:backdrop-blur-sm backdrop:bg-black/60 m-auto animate-fade-in"
      >
        {showModal && (
          <div className="flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-hairline flex justify-between items-center bg-surface-2">
              <h2 className="text-lg font-bold text-ink m-0">
                {editingId ? "Edit Periode" : "Tambah Periode Baru"}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-ink-subtle hover:text-ink p-1 rounded-md hover:bg-surface-3 transition-colors bg-transparent border-none cursor-pointer flex-shrink-0">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-[2] flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block">Nama Kabinet</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Cth: Kabinet Harmoni Karya"
                    className="w-full py-2.5 px-4 rounded-lg bg-canvas text-ink border border-hairline text-sm focus:outline-none focus:border-hairline-strong placeholder-ink-subtle"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block">Periode</label>
                  <input value={formPeriod} onChange={e => setFormPeriod(e.target.value)} placeholder="2026"
                    className="w-full py-2.5 px-4 rounded-lg bg-canvas text-ink border border-hairline text-sm focus:outline-none focus:border-hairline-strong placeholder-ink-subtle"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block">Visi</label>
                <textarea value={formVision} onChange={e => setFormVision(e.target.value)} rows={2}
                  className="w-full py-2.5 px-4 rounded-lg resize-y bg-canvas text-ink border border-hairline text-sm focus:outline-none focus:border-hairline-strong placeholder-ink-subtle"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block">Misi (satu per baris)</label>
                <textarea value={formMissions} onChange={e => setFormMissions(e.target.value)} rows={4} placeholder={"Misi pertama\nMisi kedua\nMisi ketiga"}
                  className="w-full py-2.5 px-4 rounded-lg resize-y bg-canvas text-ink border border-hairline text-sm focus:outline-none focus:border-hairline-strong placeholder-ink-subtle"
                />
              </div>
            </div>

            <div className="px-6 py-4 flex justify-end gap-3 border-t border-hairline bg-surface-2 mt-auto">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer bg-surface-3 text-ink border border-hairline hover:bg-hairline transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={!formName || !formPeriod} className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                (!formName || !formPeriod) ? "bg-surface-3 text-ink-muted cursor-not-allowed border border-hairline" : "bg-primary hover:bg-primary-hover text-on-primary cursor-pointer active:scale-95 border border-primary-focus"
              }`}>{editingId ? "Simpan Perubahan" : "Buat Periode"}</button>
            </div>
          </div>
        )}
      </dialog>
    </DashboardShell>
  );
}
