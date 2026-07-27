"use client";

import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Loader2, Clock, FileText, Send, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/shared/api/axios';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { DateTimePicker } from '@/components/ui/date-time-picker';

interface Task {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  type: 'individu' | 'kelompok' | 'INDIVIDU' | 'KELOMPOK';
  status: 'PUBLISHED' | 'DRAFT';
}

export default function EvaluatorPage() {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'published' | 'draft'>('all');

  // Task Creation Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [type, setType] = useState<'individu' | 'kelompok'>('individu');
  const [publishMode, setPublishMode] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/pkkmb/tasks');
      setTasks(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil daftar penugasan.', 'ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !deadline) {
      toast.error('Seluruh kolom form penugasan wajib diisi.', 'VALIDASI GAGAL');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/pkkmb/pemateri/tasks', {
        title,
        description,
        type,
        status: publishMode,
        deadline: new Date(deadline).toISOString(),
      });

      const messageMap = {
        PUBLISHED: 'Tugas baru berhasil diterbitkan untuk Mahasiswa Baru!',
        DRAFT: 'Tugas berhasil disimpan sebagai Draf.',
      };
      toast.success(messageMap[publishMode], 'SUKSES');

      setIsTaskModalOpen(false);
      setTitle('');
      setDescription('');
      setDeadline('');
      setPublishMode('PUBLISHED');
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error('Gagal memproses penugasan.', 'GAGAL');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterTab === 'published') return task.status === 'PUBLISHED' || !task.status;
    if (filterTab === 'draft') return task.status === 'DRAFT';
    return true;
  });

  const handleOpenTaskModal = () => {
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 1);
    const yStr = defaultDeadline.getFullYear();
    const mStr = String(defaultDeadline.getMonth() + 1).padStart(2, '0');
    const dStr = String(defaultDeadline.getDate()).padStart(2, '0');
    setDeadline(`${yStr}-${mStr}-${dStr}T23:59`);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header (Independent) */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--border-subtle)]">
        <div className="p-3 bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded-lg text-[var(--accent)] shrink-0">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
            PENILAIAN, EVALUASI & DRAF TUGAS
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
            Terbitkan tugas baru, simpan draf penugasan, dan berikan evaluasi nilai bagi Mahasiswa Baru.
          </p>
        </div>
      </div>

      {/* Floating Action Toolbar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-[var(--accent)] text-black shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            SEMUA ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('published')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
              filterTab === 'published'
                ? 'bg-[var(--accent)] text-black shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            PUBLIK ({tasks.filter((t) => t.status === 'PUBLISHED' || !t.status).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('draft')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
              filterTab === 'draft'
                ? 'bg-[var(--accent)] text-black shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            DRAF ({tasks.filter((t) => t.status === 'DRAFT').length})
          </button>
        </div>

        <button
          type="button"
          onClick={handleOpenTaskModal}
          className="btn-accent px-5 py-2.5 font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Terbitkan Tugas Baru</span>
        </button>
      </div>

      {/* Task List / Evaluation Table */}
      {isLoading ? (
        <LoadingState message="Memuat daftar penugasan & draf..." />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="BELUM ADA PENUGASAN"
          description="Klik 'Terbitkan Tugas Baru' untuk membuat penugasan individu, kelompok, atau draf."
        />
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task._id} className="surface-card p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Status Badge */}
                  {task.status === 'DRAFT' ? (
                    <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold text-[var(--text-muted)] bg-white/5 border border-white/10 rounded uppercase tracking-wider flex items-center gap-1">
                      <FileText className="h-3 w-3" /> DRAF PENUGASAN
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold text-[var(--semantic-success)] bg-[var(--semantic-success)]/10 border border-[var(--semantic-success)]/30 rounded uppercase tracking-wider flex items-center gap-1">
                      <Send className="h-3 w-3" /> TUGAS PUBLIK RESMI
                    </span>
                  )}

                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold text-[var(--accent)] bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded uppercase tracking-wider">
                    TUGAS {task.type.toUpperCase()}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1 ml-auto">
                  <Clock className="h-3.5 w-3.5 text-[var(--accent)]" />
                  Batas Waktu:{' '}
                  {new Date(task.deadline).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <h3 className="text-sm font-bold text-[var(--text-primary)]">{task.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {task.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Dialog
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="TERBITKAN TUGAS / DRAF BARU"
        description="Pilih untuk memublikasikan tugas langsung ke Mahasiswa Baru atau menyimpannya sebagai Draf."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
              Judul Penugasan *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Resume Materi Kebangsaan & Etika Mahasiswa"
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
              Tipe Penugasan *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'individu' | 'kelompok')}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              <option value="individu">INDIVIDU</option>
              <option value="kelompok">KELOMPOK</option>
            </select>
          </div>

          <DateTimePicker
            label="Batas Pengumpulan (Deadline)"
            required
            value={deadline}
            onChange={setDeadline}
          />

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
              Deskripsi & Ketentuan *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan instruksi penugasan, format file, dan kriteria penilaian..."
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)] leading-relaxed"
            />
          </div>

          {/* Mode Publikasi vs Draf */}
          <div className="space-y-2 pt-1 border-t border-[var(--border-subtle)]">
            <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
              Status Terbit *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-lg border flex items-center justify-center gap-2.5 cursor-pointer transition-all ${
                  publishMode === 'PUBLISHED'
                    ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)] font-bold'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--border-emphasis)]'
                }`}
              >
                <input
                  type="radio"
                  name="taskPublishMode"
                  value="PUBLISHED"
                  checked={publishMode === 'PUBLISHED'}
                  onChange={() => setPublishMode('PUBLISHED')}
                  className="sr-only"
                />
                <Send className="h-4 w-4" />
                <span className="text-xs font-mono uppercase tracking-wider">Terbitkan Sekarang</span>
              </label>

              <label
                className={`p-3 rounded-lg border flex items-center justify-center gap-2.5 cursor-pointer transition-all ${
                  publishMode === 'DRAFT'
                    ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)] font-bold'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--border-emphasis)]'
                }`}
              >
                <input
                  type="radio"
                  name="taskPublishMode"
                  value="DRAFT"
                  checked={publishMode === 'DRAFT'}
                  onChange={() => setPublishMode('DRAFT')}
                  className="sr-only"
                />
                <FileText className="h-4 w-4" />
                <span className="text-xs font-mono uppercase tracking-wider">Simpan Draf</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
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
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>{publishMode === 'PUBLISHED' ? 'Terbitkan Tugas' : 'Simpan Draf'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
