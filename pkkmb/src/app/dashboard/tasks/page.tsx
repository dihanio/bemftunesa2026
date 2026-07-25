"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { apiClient } from '@/shared/api/axios';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Link as LinkIcon,
  Send,
  ExternalLink,
  Loader2,
  Info,
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

interface Task {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  type: 'INDIVIDU' | 'KELOMPOK';
}

interface Submission {
  _id: string;
  taskId: string | { _id: string };
  fileUrl: string;
  status: string;
  score?: number;
  feedback?: string;
  submittedAt: string;
}

export default function TasksPage() {
  const { user } = useAuthStore();
  const toast = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Record<string, Submission>>({});
  const [isFetchingData, setIsFetchingData] = useState(true);

  // Submission Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setIsFetchingData(true);
    try {
      const [tasksRes, subsRes] = await Promise.all([
        apiClient.get('/pkkmb/tasks'),
        apiClient.get('/pkkmb/tasks/my-submissions').catch(() => ({ data: { data: [] } })),
      ]);

      const loadedTasks: Task[] = tasksRes.data?.data || [];
      setTasks(loadedTasks);

      const subList: Submission[] = subsRes.data?.data || [];
      const subMap: Record<string, Submission> = {};
      subList.forEach((sub) => {
        const tId = typeof sub.taskId === 'string' ? sub.taskId : sub.taskId?._id;
        if (tId) subMap[tId] = sub;
      });
      setMySubmissions(subMap);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingData(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleOpenModal = (task: Task) => {
    setSelectedTask(task);
    const existing = mySubmissions[task._id];
    setLinkUrl(existing?.fileUrl || '');
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (!linkUrl.trim()) {
      toast.error('Masukkan tautan URL (Google Drive, YouTube, dll.)', 'TAUTAN WAJIB');
      return;
    }

    if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
      toast.error('Format URL harus diawali dengan http:// atau https://', 'FORMAT URL GAGAL');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(`/pkkmb/tasks/${selectedTask._id}/submit`, {
        fileUrl: linkUrl.trim(),
      });

      toast.success('Tugas berhasil dikumpulkan!', 'SUKSES');
      setSelectedTask(null);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Gagal mengumpulkan tugas.', 'GAGAL');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetchingData) {
    return <LoadingState message="Memuat daftar penugasan..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--border-subtle)]">
        <div className="p-3 bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded-lg text-[var(--accent)] shrink-0">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
            PENUGASAN MAHASISWA BARU
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
            Kumpulkan tugas individu & kelompok tepat waktu menggunakan tautan link (Google Drive / YouTube / Cloud Link).
          </p>
        </div>
      </div>

      {/* Task List Grid */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="BELUM ADA PENUGASAN"
            description="Penugasan resmi PKKMB Adrata 2026 akan dipublikasikan oleh Panitia."
          />
        ) : (
          tasks.map((task) => {
            const submission = mySubmissions[task._id];
            const isSubmitted = Boolean(submission);

            return (
              <div key={task._id} className="surface-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Submission Status Badge */}
                    {isSubmitted ? (
                      <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold text-[var(--semantic-success)] bg-[var(--semantic-success)]/10 border border-[var(--semantic-success)]/30 rounded uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> SUDAH DIKUMPULKAN
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold text-[var(--semantic-warning)] bg-[var(--semantic-warning)]/10 border border-[var(--semantic-warning)]/30 rounded uppercase tracking-wider flex items-center gap-1">
                        <Clock className="h-3 w-3" /> BELUM DIKUMPULKAN
                      </span>
                    )}

                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold text-[var(--accent)] bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded uppercase tracking-wider">
                      TUGAS {task.type}
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

                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{task.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line mt-1">
                    {task.description}
                  </p>
                </div>

                {/* Submitted Details if available */}
                {isSubmitted && submission && (
                  <div className="p-3.5 bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-lg space-y-1.5">
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-bold">
                      TAUTAN LINK TERKUMPUL:
                    </div>
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-[var(--accent)] underline flex items-center gap-1.5 truncate font-bold hover:text-[var(--text-primary)] transition-colors"
                    >
                      <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{submission.fileUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    {submission.score !== undefined && (
                      <div className="text-xs font-mono text-[var(--semantic-success)] pt-1 font-bold">
                        NILAI TUGAS: {submission.score} / 100 {submission.feedback && `• "${submission.feedback}"`}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(task)}
                    className="btn-accent px-5 py-2.5 font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md hover:scale-105 transition-all"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span>{isSubmitted ? 'Edit Tautan Link' : 'Kumpulkan Tugas'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submission Modal Dialog (Google Drive / Link Based) */}
      <Dialog
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title={`KUMPULKAN TUGAS: ${selectedTask?.title || ''}`}
        description="Tempelkan tautan link Google Drive atau Cloud Drive karya Anda di bawah ini."
        maxWidth="lg"
      >
        {selectedTask && (
          <form onSubmit={handleSubmitTask} className="space-y-4">
            {/* Step-by-Step Instructions */}
            <div className="p-3.5 bg-[var(--bg-surface-elevated)] border border-[var(--border-emphasis)] rounded-lg space-y-2">
              <div className="text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5">
                <Info className="h-4 w-4" /> PANDUAN PENGUMPULAN TAUTAN (GOOGLE DRIVE):
              </div>
              <ol className="text-xs font-mono text-[var(--text-secondary)] space-y-1 list-decimal list-inside leading-relaxed">
                <li>Unggah berkas tugas Anda ke <strong>Google Drive</strong> pribadi Anda.</li>
                <li>Klik kanan file &gt; <strong>Bagikan</strong> &gt; Ubah akses ke <strong>&quot;Siapa saja yang memiliki link&quot;</strong>.</li>
                <li>Salin link lalu <strong>tempelkan URL link</strong> pada kolom di bawah ini.</li>
              </ol>
            </div>

            {/* Input URL */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
                Tautan Link URL (Google Drive / YouTube / Figma / GitHub) *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)]"
                />
                {linkUrl.startsWith('http') && (
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2.5 bg-white/5 border border-[var(--border-default)] hover:border-[var(--accent)] text-[var(--accent)] font-mono text-xs rounded flex items-center gap-1 shrink-0 transition-colors"
                    title="Uji Buka Link"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden sm:inline font-bold">Uji Link</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
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
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Kirim Pengumpulan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
