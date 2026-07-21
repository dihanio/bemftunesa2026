"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Info, CheckCircle, Plus } from "lucide-react";
import { useConfirm } from "@/components/ui/CustomConfirm";
import { useLetters, useLetterMutations } from "@/hooks/useLetters";
import { RequirePermission } from "@/components/authorization/RequirePermission";
import { LetterData } from "@/types/letter";

import { LetterFilter } from "./components/LetterFilter";
import { LetterTable } from "./components/LetterTable";
import { LetterFormModal } from "./components/LetterFormModal";

export default function PersuratanPage() {
  const { confirm } = useConfirm();

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dssMode, setDssMode] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<LetterData | null>(null);

  // Queries & Mutations
  const { data: letters, isLoading, error: queryError, refetch } = useLetters(selectedType, selectedStatus, dssMode);
  const { create, update, remove, isMutating, error: mutationError, clearError } = useLetterMutations();

  // Derived State
  const filteredLetters = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return letters.filter((l) =>
      l.subject.toLowerCase().includes(query) ||
      l.sender.toLowerCase().includes(query) ||
      l.recipient.toLowerCase().includes(query) ||
      (l.referenceNumber && l.referenceNumber.toLowerCase().includes(query))
    );
  }, [letters, searchQuery]);

  const error = queryError?.message || mutationError?.message || null;

  // Handlers
  const handleOpenAdd = () => {
    setCurrentLetter(null);
    setModalOpen(true);
    clearError();
  };

  const handleOpenEdit = (letter: LetterData) => {
    setCurrentLetter(letter);
    setModalOpen(true);
    clearError();
  };

  const handleSubmit = async (formData: Partial<LetterData>) => {
    clearError();
    if (currentLetter) {
      await update(currentLetter.id, formData);
    } else {
      await create(formData);
    }
    setModalOpen(false);
    refetch();
  };

  const handleDelete = async (id: string, subject: string) => {
    const confirmed = await confirm({
      title: "Hapus Surat",
      message: `Apakah Anda yakin ingin menghapus surat "${subject}"?`,
      type: "danger",
      confirmLabel: "Ya, Hapus"
    });
    if (!confirmed) return;
    
    clearError();
    await remove(id);
    refetch();
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hairline pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-ink tracking-tight">E-Surat & Arsip Digital</h1>
            <p className="text-sm text-ink-muted mt-1">
              Kelola sirkulasi persuratan, proposal, dan LPJ dengan sistem Kanban-approval otomatis.
            </p>
          </div>
          <RequirePermission permission="letters:create" fallback={null}>
            <button
              onClick={handleOpenAdd}
              className="bg-primary hover:bg-primary-hover text-ink font-bold py-2.5 px-5 rounded-xl transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Catat Surat Baru
            </button>
          </RequirePermission>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <LetterFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          dssMode={dssMode}
          setDssMode={setDssMode}
        />

        {/* Content Table */}
        <LetterTable
          letters={filteredLetters}
          loading={isLoading}
          dssMode={dssMode}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />

        {/* Form Modal */}
        <LetterFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          initialData={currentLetter}
          isSubmitting={isMutating}
        />
      </div>
    </DashboardShell>
  );
}
