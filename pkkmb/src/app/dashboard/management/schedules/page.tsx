"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Loader2, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/shared/api/axios';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { DateTimePicker } from '@/components/ui/date-time-picker';

interface Schedule {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
}

export default function SchedulesManagementPage() {
  const toast = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/pkkmb/schedules');
      setSchedules(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil jadwal kegiatan.', 'ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startTime || !endTime) {
      toast.error('Nama kegiatan dan waktu pelaksanaan wajib diisi.', 'VALIDASI GAGAL');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/pkkmb/admin/schedules', {
        name,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        location,
        description,
      });
      toast.success('Jadwal kegiatan berhasil ditambahkan!', 'SUKSES');
      setIsModalOpen(false);
      setName('');
      setStartTime('');
      setEndTime('');
      setLocation('');
      setDescription('');
      fetchSchedules();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menambahkan jadwal kegiatan.', 'GAGAL');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;

    try {
      await apiClient.delete(`/pkkmb/admin/schedules/${id}`);
      toast.success('Jadwal berhasil dihapus.', 'DIHAPUS');
      fetchSchedules();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus jadwal.', 'ERROR');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header (Independent) */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--border-subtle)]">
        <div className="p-3 bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded-lg text-[var(--accent)] shrink-0">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
            MANAJEMEN JADWAL KEGIATAN
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
            Atur dan terbitkan linimasa rangkaian kegiatan PKKMB Adrata 2026.
          </p>
        </div>
      </div>

      {/* Floating Action Toolbar (Outside Header) */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-accent px-5 py-2.5 font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Jadwal</span>
        </button>
      </div>

      {/* Schedule List */}
      {isLoading ? (
        <LoadingState message="Memuat jadwal kegiatan..." />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="BELUM ADA JADWAL KEGIATAN"
          description="Klik tombol 'Tambah Jadwal' untuk menyusun linimasa PKKMB."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((sched) => (
            <div key={sched._id} className="surface-card p-5 flex gap-4 items-start relative group">
              <div className="flex flex-col items-center justify-center p-3 bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent-glow)] rounded-md min-w-[64px] shrink-0">
                <span className="text-xl font-mono font-bold leading-none">
                  {new Date(sched.startTime).getDate()}
                </span>
                <span className="text-[10px] uppercase font-mono font-bold mt-1">
                  {new Date(sched.startTime).toLocaleString('id-ID', { month: 'short' })}
                </span>
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{sched.name}</h4>
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(sched._id)}
                    className="p-1 text-[var(--semantic-danger)] hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                    title="Hapus Jadwal"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[var(--accent)]" />
                  {new Date(sched.startTime).toLocaleString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(sched.endTime).toLocaleString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>

                {sched.location && (
                  <div className="text-[10px] font-mono text-[var(--text-secondary)] flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span>{sched.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Schedule Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="TAMBAH JADWAL KEGIATAN BARU"
        description="Jadwal akan ditampilkan di linimasa PKKMB Mahasiswa Baru & Panitia."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
              Nama Kegiatan *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Upacara Pembukaan PKKMB FT UNESA 2026"
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-4">
            <DateTimePicker
              label="Waktu Mulai"
              required
              value={startTime}
              onChange={setStartTime}
            />

            <DateTimePicker
              label="Waktu Selesai"
              required
              value={endTime}
              onChange={setEndTime}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
              Lokasi / Ruangan
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Lapangan Utama FT / Halaman Gedung A6"
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
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
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan Jadwal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
