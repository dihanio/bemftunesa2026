"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService from "@/lib/api";
import { Search, Plus, Users, Trash2, UserPlus, ClipboardList, ChevronDown, ChevronRight, X, Calendar, CheckCircle2, Clock, FileText } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useConfirm } from "@/components/ui/CustomConfirm";

interface CommitteeMember {
  userId: { _id: string; name: string; nim?: string; email?: string; avatar?: string };
  role: string;
  joinedAt: string;
}

interface CommitteeItem {
  _id: string;
  programId: { _id: string; title: string; department?: { name: string } };
  name: string;
  description?: string;
  members: CommitteeMember[];
  isActive: boolean;
  createdAt: string;
}

interface ProgramOption {
  _id: string;
  title: string;
  department?: { _id: string; name: string };
}

interface UserOption {
  _id: string;
  name: string;
  nim?: string;
  email?: string;
}

export default function KepanitiaaanPage() {
  const { confirm } = useConfirm();
  const [committees, setCommittees] = useState<CommitteeItem[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState<string | null>(null);

  const createDialogRef = React.useRef<HTMLDialogElement>(null);
  const addMemberDialogRef = React.useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (showCreateModal) createDialogRef.current?.showModal();
    else createDialogRef.current?.close();
  }, [showCreateModal]);

  useEffect(() => {
    if (showAddMemberModal) addMemberDialogRef.current?.showModal();
    else addMemberDialogRef.current?.close();
  }, [showAddMemberModal]);

  // Create form
  const [newName, setNewName] = useState("");
  const [newProgramId, setNewProgramId] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Add member form
  const [memberUserId, setMemberUserId] = useState("");
  const [memberRole, setMemberRole] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, pRes, uRes] = await Promise.all([
        ImsApiService.getCommittees<CommitteeItem>(),
        ImsApiService.getProkers<ProgramOption>(),
        ImsApiService.getUsers<UserOption>(),
      ]);
      if (cRes.success && cRes.data) setCommittees(cRes.data);
      if (pRes.success && pRes.data) setPrograms(pRes.data);
      if (uRes.success && uRes.data) setAllUsers(uRes.data);
    } catch (err) {
      console.error("Gagal memuat data kepanitiaan:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async () => {
    if (!newProgramId || !newName) return;
    try {
      await ImsApiService.createCommittee({
        programId: newProgramId,
        name: newName,
        description: newDescription || undefined,
      });
      setShowCreateModal(false);
      setNewName(""); setNewProgramId(""); setNewDescription("");
      fetchAll();
    } catch (err) {
      console.error("Gagal membuat kepanitiaan:", err);
    }
  };

  const handleAddMember = async () => {
    if (!showAddMemberModal || !memberUserId || !memberRole) return;
    try {
      await ImsApiService.addCommitteeMember(showAddMemberModal, {
        userId: memberUserId,
        role: memberRole,
      });
      setShowAddMemberModal(null);
      setMemberUserId(""); setMemberRole("");
      fetchAll();
    } catch (err) {
      console.error("Gagal menambah anggota:", err);
    }
  };

  const handleRemoveMember = async (committeeId: string, userId: string, name: string) => {
    const ok = await confirm({
      title: "Hapus Anggota",
      message: `Keluarkan "${name}" dari kepanitiaan?`,
      confirmLabel: "Hapus",
      type: "danger",
    });
    if (!ok) return;
    await ImsApiService.removeCommitteeMember(committeeId, userId);
    fetchAll();
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Hapus Kepanitiaan",
      message: `Hapus kepanitiaan "${name}"? Ini tidak dapat dibatalkan.`,
      confirmLabel: "Hapus Permanen",
      type: "danger",
    });
    if (!ok) return;
    await ImsApiService.deleteCommittee(id);
    fetchAll();
  };

  const filtered = committees.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.programId?.title?.toLowerCase().includes(search.toLowerCase())
  );

  // Programs that don't already have a committee
  const availablePrograms = programs.filter(
    p => !committees.some(c => c.programId?._id === p._id)
  );

  return (
    <DashboardShell>
      <div className="w-full max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink m-0">
              Kepanitiaan
            </h1>
            <p className="text-sm text-ink-subtle mt-1">
              Kelola susunan panitia untuk setiap Program Kerja
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="fixed bottom-6 right-6 z-40 md:static md:bottom-auto md:right-auto bg-primary hover:bg-primary-hover text-on-primary font-medium py-3 px-6 md:py-2.5 md:px-5 rounded-md md:rounded-lg text-sm flex items-center gap-2 transition-all active:scale-95 md: border border-primary-focus"
          >
            <Plus size={18} className="md:w-4 md:h-4" /> Buat Kepanitiaan
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-surface-1 rounded-lg px-3 py-2 mb-5 border border-hairline focus-within:border-hairline-strong transition-colors">
          <Search size={16} className="text-ink-subtle" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari kepanitiaan atau proker..."
            className="flex-1 bg-transparent border-none outline-none text-ink text-sm placeholder-ink-subtle"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-ink-subtle text-sm">
            Memuat data...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-ink-subtle bg-surface-1 rounded-xl border border-hairline flex flex-col items-center justify-center">
            <ClipboardList size={40} className="mb-3 opacity-40 text-ink-tertiary" />
            <p className="m-0 font-medium text-ink">Belum ada kepanitiaan</p>
            <p className="text-sm mt-1 text-ink-muted">Klik "Buat Kepanitiaan" untuk menambahkan.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(c => {
              const isExpanded = expandedId === c._id;
              return (
                <div key={c._id} className="bg-surface-1 border border-hairline rounded-xl overflow-hidden transition-all">
                  {/* Header Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : c._id)}
                    className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-surface-2 transition-colors select-none"
                  >
                    <span className="text-ink-subtle">{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-ink m-0">
                        {c.name}
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">
                        Proker: {c.programId?.title || "—"} • {c.members.length} anggota
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded border ${
                      c.isActive ? "bg-semantic-success/10 text-semantic-success border-semantic-success/20" : "bg-surface-3 text-ink-muted border-hairline-strong"
                    }`}>
                      {c.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-hairline pt-3">
                      {c.description && (
                        <p className="text-sm text-ink-subtle my-3 leading-relaxed">
                          {c.description}
                        </p>
                      )}

                      {/* Members Table */}
                      <div className="flex justify-between items-center mt-4 mb-2">
                        <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
                          <Users size={14} className="text-ink-subtle" />
                          Anggota Panitia
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); setShowAddMemberModal(c._id); }}
                          className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-primary/20 transition-colors active:scale-95"
                        >
                          <UserPlus size={13} /> Tambah
                        </button>
                      </div>

                      {c.members.length === 0 ? (
                        <div className="text-sm text-ink-subtle py-4 border border-dashed border-hairline rounded-lg text-center mt-2 bg-surface-2">
                          Belum ada anggota. Klik "Tambah" untuk menambahkan.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-sm text-left mt-2">
                            <thead>
                              <tr className="border-b border-hairline">
                                <th className="py-2.5 px-2 text-ink-subtle font-medium w-1/3">Nama</th>
                                <th className="py-2.5 px-2 text-ink-subtle font-medium w-1/4">NIM</th>
                                <th className="py-2.5 px-2 text-ink-subtle font-medium">Jabatan Panitia</th>
                                <th className="py-2.5 px-2 w-10"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {c.members.map((m, i) => (
                                <tr key={i} className="border-b border-hairline/50 hover:bg-surface-2/50 transition-colors">
                                  <td className="py-3 px-2 text-ink">{m.userId?.name || "—"}</td>
                                  <td className="py-3 px-2 text-ink-muted">{m.userId?.nim || "—"}</td>
                                  <td className="py-3 px-2">
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-hairline-strong bg-surface-3 text-ink whitespace-nowrap">
                                      {m.role}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-right">
                                    <button
                                      onClick={() => handleRemoveMember(c._id, m.userId?._id, m.userId?.name || "")}
                                      className="text-semantic-danger hover:bg-semantic-danger/10 border border-transparent hover:border-semantic-danger/20 rounded p-1.5 cursor-pointer transition-colors active:scale-95 inline-flex"
                                      title="Hapus Anggota"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end mt-4 pt-3 border-t border-hairline">
                        <button
                          onClick={() => handleDelete(c._id, c.name)}
                          className="flex items-center gap-1.5 bg-semantic-danger/10 text-semantic-danger border border-semantic-danger/20 rounded-full px-3.5 py-1.5 text-xs font-semibold cursor-pointer hover:bg-semantic-danger/20 transition-colors active:scale-95"
                        >
                          <Trash2 size={13} /> Hapus Kepanitiaan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <dialog
        ref={createDialogRef}
        onClose={() => setShowCreateModal(false)}
        onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
        className="bg-transparent border-none p-0 m-auto backdrop:backdrop-blur-sm backdrop:bg-black/60 animate-fade-in w-full max-w-[440px]"
      >
        {showCreateModal && (
          <div onClick={e => e.stopPropagation()} className="bg-surface-1 border border-hairline-strong rounded-xl p-6 w-full mx-4 sm:mx-auto">
            <div className="flex justify-between items-center mb-5 border-b border-hairline pb-4">
              <h2 className="text-lg font-bold text-ink m-0">
                Buat Kepanitiaan Baru
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="bg-transparent border-none text-ink-subtle hover:text-ink cursor-pointer hover:bg-surface-3 p-1 rounded-md transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1.5 uppercase tracking-wider">Program Kerja</label>
                <CustomSelect
                  value={newProgramId}
                  onChange={setNewProgramId}
                  options={[
                    { value: "", label: "Pilih Program Kerja..." },
                    ...availablePrograms.map(p => ({
                      value: p._id,
                      label: `${p.title} (${p.department?.name || "—"})`
                    }))
                  ]}
                  placeholder="Pilih Program Kerja..."
                  className="bg-canvas text-ink border-hairline hover:bg-surface-2"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1.5 uppercase tracking-wider">Nama Kepanitiaan</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Cth: Panitia Workshop AI 2026"
                  className="w-full px-3 py-2.5 rounded-lg bg-canvas text-ink border border-hairline text-sm focus:outline-none focus:border-hairline-strong transition-colors placeholder-ink-subtle"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1.5 uppercase tracking-wider">Deskripsi (opsional)</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="Keterangan singkat..."
                  className="w-full px-3 py-2.5 rounded-lg bg-canvas text-ink border border-hairline text-sm focus:outline-none focus:border-hairline-strong transition-colors resize-y placeholder-ink-subtle"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-hairline">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                Batal
              </button>
              <button onClick={handleCreate} disabled={!newProgramId || !newName} className="btn-primary">
                Buat Kepanitiaan
              </button>
            </div>
          </div>
        )}
      </dialog>

      {/* Add Member Modal */}
      <dialog
        ref={addMemberDialogRef}
        onClose={() => setShowAddMemberModal(null)}
        onClick={(e) => { if (e.target === e.currentTarget) setShowAddMemberModal(null); }}
        className="bg-transparent border-none p-0 m-auto backdrop:backdrop-blur-sm backdrop:bg-black/60 animate-fade-in w-full max-w-[400px]"
      >
        {showAddMemberModal && (
          <div onClick={e => e.stopPropagation()} className="bg-surface-1 border border-hairline-strong rounded-xl p-6 w-full mx-4 sm:mx-auto">
            <div className="flex justify-between items-center mb-5 border-b border-hairline pb-4">
              <h2 className="text-lg font-bold text-ink m-0">
                Tambah Anggota Panitia
              </h2>
              <button onClick={() => setShowAddMemberModal(null)} className="bg-transparent border-none text-ink-subtle hover:text-ink cursor-pointer hover:bg-surface-3 p-1 rounded-md transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1.5 uppercase tracking-wider">Pilih Anggota</label>
                <CustomSelect
                  value={memberUserId}
                  onChange={setMemberUserId}
                  options={[
                    { value: "", label: "Pilih anggota..." },
                    ...allUsers.map(u => ({
                      value: u._id,
                      label: `${u.name} ${u.nim ? `(${u.nim})` : ""}`
                    }))
                  ]}
                  placeholder="Pilih anggota..."
                  className="bg-canvas text-ink border-hairline hover:bg-surface-2"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1.5 uppercase tracking-wider">Jabatan Kepanitiaan</label>
                <input
                  value={memberRole}
                  onChange={e => setMemberRole(e.target.value)}
                  placeholder="Cth: Ketua Pelaksana, Sekretaris"
                  className="w-full px-3 py-2.5 rounded-lg bg-canvas text-ink border border-hairline text-sm focus:outline-none focus:border-hairline-strong transition-colors placeholder-ink-subtle"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-hairline">
              <button onClick={() => setShowAddMemberModal(null)} className="btn-secondary">
                Batal
              </button>
              <button onClick={handleAddMember} disabled={!memberUserId || !memberRole} className="btn-primary">
                Tambah
              </button>
            </div>
          </div>
        )}
      </dialog>
    </DashboardShell>
  );
}
