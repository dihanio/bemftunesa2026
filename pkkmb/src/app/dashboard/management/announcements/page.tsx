"use client";

import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Loader2, Clock, FileText, Send, Calendar, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/shared/api/axios';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { DateTimePicker } from '@/components/ui/date-time-picker';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  isPriority: boolean;
  status: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED';
  scheduledAt?: string;
  createdAt: string;
}

export default function AnnouncementsManagementPage() {
  const toast = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [publishMode, setPublishMode] = useState<'PUBLISHED' | 'DRAFT' | 'SCHEDULED'>('PUBLISHED');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/pkkmb/announcements');
      setAnnouncements(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil daftar pengumuman.', 'ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Judul dan isi pengumuman tidak boleh kosong.', 'VALIDASI GAGAL');
      return;
    }

    if (publishMode === 'SCHEDULED' && !scheduledAt) {
      toast.error('Pilih tanggal dan waktu rilis otomatis untuk opsi Penjadwalan.', 'WAKTU DIBUTUHKAN');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/pkkmb/admin/announcements', {
        title,
        content,
        isPriority,
        status: publishMode,
        scheduledAt: publishMode === 'SCHEDULED' ? new Date(scheduledAt).toISOString() : undefined,
      });

      const messageMap = {
        PUBLISHED: 'Pengumuman resmi berhasil dipublikasikan!',
        DRAFT: 'Pengumuman berhasil disimpan sebagai Draf.',
        SCHEDULED: 'Pengumuman berhasil dijadwalkan untuk rilis otomatis!',
      };
      toast.success(messageMap[publishMode], 'SUKSES');

      setIsModalOpen(false);
      setTitle('');
      setContent('');
      setIsPriority(false);
      setPublishMode('PUBLISHED');
      setScheduledAt('');
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      toast.error('Gagal memproses pengumuman.', 'GAGAL');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;

    try {
      await apiClient.delete(`/pkkmb/admin/announcements/${id}`);
      toast.success('Pengumuman berhasil dihapus.', 'DIHAPUS');
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus pengumuman.', 'ERROR');
    }
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    if (filterTab === 'published') return ann.status === 'PUBLISHED' || !ann.status;
    if (filterTab === 'draft') return ann.status === 'DRAFT';
    if (filterTab === 'scheduled') return ann.status === 'SCHEDULED';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header (Independent) */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--border-subtle)]">
        <div className="p-3 bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded-lg text-[var(--accent)] shrink-0">
          <Megaphone className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
            MANAJEMEN PENGUMUMAN & DRAF
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
            Buat draf, atur rilis otomatis terjadwal, atau publikasikan pengumuman resmi PKKMB Adrata 2026.
          </p>
        </div>
      </div>

      {/* Action Toolbar & Filter Tabs */}
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
            SEMUA ({announcements.length})
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
            PUBLIK ({announcements.filter((a) => a.status === 'PUBLISHED' || !a.status).length})
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
            DRAF ({announcements.filter((a) => a.status === 'DRAFT').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('scheduled')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
              filterTab === 'scheduled'
                ? 'bg-[var(--accent)] text-black shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            TERJADWAL ({announcements.filter((a) => a.status === 'SCHEDULED').length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-accent px-5 py-2.5 font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Pengumuman</span>
        </button>
      </div>

      {/* List Content */}
      {isLoading ? (
        <LoadingState message="Memuat daftar pengumuman & draf..." />
      ) : filteredAnnouncements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="BELUM ADA PENGUMUMAN"
          description="Klik tombol 'Buat Pengumuman' untuk menambahkan pengumuman atau menyimpan draf baru."
        />
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => (
            <div key={ann._id} className="surface-card p-5 space-y-3 relative group">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Status Badge */}
                  {ann.status === 'DRAFT' ? (
                    <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold text-[var(--text-muted)] bg-white/5 border border-white/10 rounded uppercase tracking-wider flex items-center gap-1">
                      <FileText className="h-3 w-3" /> DRAF (BELUM DIBAGIKAN)
                    </span>
                  ) : ann.status === 'SCHEDULED' ? (
                    <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold text-[var(--semantic-warning)] bg-[var(--semantic-warning)]/10 border border-[var(--semantic-warning)]/30 rounded uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3" /> RILIS TERJADWAL:{' '}
                      {ann.scheduledAt
                        ? new Date(ann.scheduledAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'TERJADWAL'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold text-[var(--semantic-success)] bg-[var(--semantic-success)]/10 border border-[var(--semantic-success)]/30 rounded uppercase tracking-wider flex items-center gap-1">
                      <Send className="h-3 w-3" /> PUBLIK RESMI
                    </span>
                  )}

                  {ann.isPriority && (
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold text-[var(--semantic-warning)] bg-[var(--semantic-warning)]/10 border border-[var(--semantic-warning)]/30 rounded uppercase tracking-wider">
                      [PENTING]
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {new Date(ann.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteAnnouncement(ann._id)}
                    className="p-1.5 text-[var(--semantic-danger)] hover:bg-red-500/10 rounded border border-red-500/20 transition-colors cursor-pointer"
                    title="Hapus Pengumuman"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold text-[var(--text-primary)]">{ann.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="BUAT PENGUMUMAN / DRAF BARU"
        description="Pilih opsi rilis langsung, simpan sebagai Draf, atau tetapkan Penjadwalan Rilis otomatis."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
              Judul Pengumuman *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pembagian Kelompok & Atribut PKKMB Adrata"
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
              Isi Pengumuman *
            </label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan rincian instruksi atau pengumuman penting di sini..."
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)] leading-relaxed"
            />
          </div>

          {/* Publishing Mode Radio Group */}
          <div className="space-y-2 pt-1 border-t border-[var(--border-subtle)]">
            <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
              Opsi Publikasi & Penjadwalan *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  publishMode === 'PUBLISHED'
                    ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--border-emphasis)]'
                }`}
              >
                <input
                  type="radio"
                  name="publishMode"
                  value="PUBLISHED"
                  checked={publishMode === 'PUBLISHED'}
                  onChange={() => setPublishMode('PUBLISHED')}
                  className="sr-only"
                />
                <Send className="h-5 w-5 mb-1.5" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Rilis Langsung</span>
                <span className="text-[10px] mt-0.5 opacity-80">Terbit saat ini juga</span>
              </label>

              <label
                className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  publishMode === 'DRAFT'
                    ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--border-emphasis)]'
                }`}
              >
                <input
                  type="radio"
                  name="publishMode"
                  value="DRAFT"
                  checked={publishMode === 'DRAFT'}
                  onChange={() => setPublishMode('DRAFT')}
                  className="sr-only"
                />
                <FileText className="h-5 w-5 mb-1.5" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Simpan Draf</span>
                <span className="text-[10px] mt-0.5 opacity-80">Hanya terlihat Panitia</span>
              </label>

              <label
                className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  publishMode === 'SCHEDULED'
                    ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--border-emphasis)]'
                }`}
              >
                <input
                  type="radio"
                  name="publishMode"
                  value="SCHEDULED"
                  checked={publishMode === 'SCHEDULED'}
                  onChange={() => setPublishMode('SCHEDULED')}
                  className="sr-only"
                />
                <Calendar className="h-5 w-5 mb-1.5" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Penjadwalan</span>
                <span className="text-[10px] mt-0.5 opacity-80">Rilis di jam tertentu</span>
              </label>
            </div>
          </div>

          {/* Scheduled Date Picker (Conditional) */}
          {publishMode === 'SCHEDULED' && (
            <div className="space-y-1.5 animate-fade-in p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-emphasis)] rounded-lg">
              <DateTimePicker
                label="Waktu Rilis Otomatis"
                required={publishMode === 'SCHEDULED'}
                value={scheduledAt}
                onChange={setScheduledAt}
              />
              <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                Pengumuman akan tersimpan dan baru ditampilkan otomatis kepada Mahasiswa Baru sesuai tanggal & jam di atas.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="priority"
              checked={isPriority}
              onChange={(e) => setIsPriority(e.target.checked)}
              className="accent-[var(--accent)] h-4 w-4 cursor-pointer"
            />
            <label
              htmlFor="priority"
              className="text-xs font-mono text-[var(--text-primary)] cursor-pointer select-none"
            >
              Tandai sebagai Pengumuman Penting / Urgent (Pin)
            </label>
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
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    {publishMode === 'PUBLISHED'
                      ? 'Publikasikan'
                      : publishMode === 'DRAFT'
                      ? 'Simpan Draf'
                      : 'Simpan Jadwal'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
