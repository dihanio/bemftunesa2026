"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { apiClient } from '@/shared/api/axios';
import { authApi } from '@/features/auth/api/auth.api';
import {
  Calendar,
  AlertTriangle,
  ChevronRight,
  Trophy,
  Megaphone,
  Clock,
  UserCheck,
  Upload,
  Shuffle,
  Crop,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

import { PkkmbProgressCard } from './cards/PkkmbProgressCard';
import { NextActionCard } from './cards/NextActionCard';
import { Select } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { PhotoCropDialog } from './PhotoCropDialog';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

interface DashboardData {
  progress: {
    percent: number;
    hasGroup: boolean;
    hasAttendedAny: boolean;
    hasSubmittedTask: boolean;
  };
  announcements: { _id: string; title: string; content: string; isPriority: boolean }[];
  upcomingSchedules: { _id: string; name: string; startTime: string; endTime: string }[];
  tasks: { graded: number; total: number };
  nextAction: string | null;
}

const PRODI_OPTIONS = [
  'S1 Pariwisata',
  'S1 Pendidikan Tata Boga',
  'S1 Pendidikan Tata Busana',
  'S1 Pendidikan Tata Rias',
  'S1 Pendidikan Teknik Bangunan',
  'S1 Pendidikan Teknik Elektro',
  'S1 Pendidikan Teknik Mesin',
  'S1 Pendidikan Teknologi Informasi',
  'S1 Pendidikan Vokasional Teknologi Otomotif',
  'S1 Perencanaan Wilayah dan Kota',
  'S1 Sistem Informasi',
  'S1 Teknik Elektro',
  'S1 Teknik Informatika',
  'S1 Teknik Mesin',
  'S1 Teknik Metalurgi',
  'S1 Teknik Pertambangan',
  'S1 Teknik Sipil',
];

export function MabaDashboard() {
  const { user: maba, updateUser } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [prodiError, setProdiError] = useState<string | undefined>(undefined);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const toast = useToast();

  // Photo Upload System State & Controls
  const photoUpload = usePhotoUpload(maba?.avatar);

  // Profile Form State
  const [selectedProdi, setSelectedProdi] = useState(maba?.studyProgram || '');

  const fetchData = React.useCallback(async () => {
    if (!maba) return;
    setIsFetchingData(true);
    try {
      const res = await apiClient.get('/pkkmb/dashboard/maba');
      setData(res.data?.data);
    } catch (err) {
      console.error(err);
    }
    setIsFetchingData(false);
  }, [maba]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdiError(undefined);

    if (!selectedProdi) {
      setProdiError('Mohon pilih Program Studi Anda.');
      toast.error('Mohon pilih Program Studi Anda.', 'PRODI WAJIB DIISI');
      return;
    }

    setIsSavingProfile(true);
    try {
      // If user cropped/selected a new photo, upload with retry mechanism
      let avatarUrlToSave = photoUpload.currentPhotoUrl;
      if (photoUpload.photoResult?.file) {
        avatarUrlToSave = await photoUpload.uploadWithRetry(async (file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }, 3);
      }

      await authApi.updateProfile({
        email: maba?.email,
        userId: maba?.id,
        studyProgram: selectedProdi,
        avatar: avatarUrlToSave,
      });

      updateUser({
        studyProgram: selectedProdi,
        avatar: avatarUrlToSave,
      });

      toast.success(
        'Profil dan Pas Foto berhasil disimpan! Data masuk antrean pengacakan kelompok.',
        'PROFIL DIPERBARUI'
      );
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan profil. Silakan coba lagi.', 'GAGAL SIMPAN');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Profile is complete when studyProgram is filled and avatar exists (not default placeholder)
  const isProfileComplete = Boolean(
    maba?.studyProgram &&
    maba?.avatar &&
    maba?.avatar !== '/pasfoto_default.png'
  );

  if (!maba) return null;

  if (isFetchingData) {
    return <LoadingState message="MEMUAT KONSOL PKKMB..." />;
  }

  if (!data) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-[var(--semantic-danger)] space-y-3">
        <AlertTriangle className="h-8 w-8 mb-1" />
        <p className="text-xs font-mono tracking-wider uppercase">Gagal memuat data konsol.</p>
        <button
          type="button"
          onClick={fetchData}
          className="btn-accent px-4 py-2 font-mono text-xs uppercase tracking-wider cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { progress, announcements, upcomingSchedules, tasks, nextAction } = data;
  const isLulus = progress.percent === 100 && tasks.graded === tasks.total && tasks.total > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Editorial Hero Welcome Banner */}
      <div className="surface-card p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-[var(--accent-muted)] to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          {/* Avatar Display */}
          <div className="h-20 w-20 rounded-full bg-[var(--bg-surface-elevated)] flex items-center justify-center text-[var(--accent)] text-2xl font-mono font-bold border-2 border-[var(--accent)] shrink-0 shadow-lg shadow-[var(--accent-glow)] relative overflow-hidden">
            {photoUpload.currentPhotoUrl && photoUpload.currentPhotoUrl !== '/pasfoto_default.png' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUpload.currentPhotoUrl}
                alt="Pas Foto Maba"
                className="h-full w-full object-cover"
              />
            ) : maba.name ? (
              maba.name.charAt(0).toUpperCase()
            ) : (
              'M'
            )}
          </div>

          <div className="text-center sm:text-left space-y-1.5 min-w-0 flex-1">
            <div className="text-[10px] font-mono text-[var(--accent)] tracking-widest uppercase font-bold">
              FAKULTAS TEKNIK UNESA &middot; KABINET DANADYAKSA 2026
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Halo, <span className="font-serif italic font-normal text-[var(--accent)]">{maba.name?.split(' ')[0]}</span>!
            </h2>
            <p className="text-xs font-mono text-[var(--text-muted)] tracking-widest uppercase">
              PKKMB ADRATA 2026
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <span className="px-3 py-1 bg-[var(--accent-muted)] border border-[var(--accent-glow)] text-[var(--accent)] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
                NIM {maba.nim || '—'}
              </span>
              <span className="px-3 py-1 bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
                {maba.studyProgram || 'PRODI BELUM DIISI'}
              </span>
              <span className="px-3 py-1 bg-[var(--accent-muted)] border border-[var(--accent-glow)] text-[var(--accent)] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
                KEL {maba.pkkmbGroup?.name || 'MENUNGGU ACAK'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile & Pas Foto System Card — Only shown if profile is NOT complete */}
      {!isProfileComplete && (
        <div className="surface-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded text-[var(--accent)]">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold text-[var(--accent)] tracking-wider uppercase">
                  ⚠️ LENGKAPI PROGRAM STUDI & PAS FOTO
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  Pilih prodi & lampirkan pas foto agar sistem dapat memasukkan data Anda ke antrean pengacakan kelompok.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-muted)] border border-[var(--accent-glow)] text-[var(--accent)] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
              <Shuffle className="h-3.5 w-3.5" /> PENGACAKAN OTOMATIS
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Custom Select Component for Program Studi */}
              <Select
                label="PROGRAM STUDI FAKULTAS TEKNIK *"
                placeholder="-- Pilih Program Studi --"
                options={PRODI_OPTIONS}
                value={selectedProdi}
                onChange={(val) => setSelectedProdi(val)}
                error={prodiError}
              />

              {/* Custom File Upload & Photo Management System */}
              <div className="space-y-3">
                <FileUpload
                  label="PAS FOTO FORMAL MAHASISWA BARU (CROP 3:4) *"
                  accept="image/*"
                  onFileSelect={photoUpload.handleSelectFile}
                  previewUrl={photoUpload.currentPhotoUrl !== '/pasfoto_default.png' ? photoUpload.currentPhotoUrl : null}
                  onRemove={photoUpload.handleRemovePhoto}
                  error={photoUpload.errorMessage || undefined}
                  helperText="Otomatis di-crop 3:4 & diompres ke WebP (< 500 KB)"
                />

                {/* Photo Management Action Bar */}
                {photoUpload.currentPhotoUrl && photoUpload.currentPhotoUrl !== '/pasfoto_default.png' && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                    {photoUpload.rawImageSrc && (
                      <button
                        type="button"
                        onClick={photoUpload.handleReCrop}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-[var(--border-default)] rounded text-[var(--accent)] flex items-center gap-1.5 uppercase font-bold"
                      >
                        <Crop className="h-3 w-3" />
                        <span>Edit Crop</span>
                      </button>
                    )}
                    {photoUpload.photoResult && (
                      <span className="text-[var(--text-muted)]">
                        Ukuran: <strong className="text-[var(--accent)]">{photoUpload.photoResult.sizeKb} KB</strong> (WebP)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Form Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile || photoUpload.status === 'uploading'}
                className="w-full sm:w-auto px-6 py-3 btn-accent font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingProfile || photoUpload.status === 'uploading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>MENYIMPAN DATA...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>SIMPAN DATA & IKUT ACAK</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Graduation Banner */}
      {isLulus && (
        <div className="bg-[var(--accent-muted)] rounded border border-[var(--accent-glow)] p-6 relative overflow-hidden flex flex-col sm:flex-row items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[var(--accent-muted)] flex items-center justify-center text-[var(--accent)] shrink-0 border border-[var(--accent-glow)]">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
              SELAMAT! ANDA LULUS PKKMB FT 2026
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Seluruh babak tugas & presensi PKKMB BEM FT UNESA telah berhasil diselesaikan.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Progress & Next Action) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Card */}
          <PkkmbProgressCard progress={progress} />

          {/* Next Action Card */}
          <NextActionCard action={nextAction} />
        </div>

        {/* Right Column (Announcements & Schedule) */}
        <div className="space-y-8">
          {/* Announcements Summary */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-[var(--accent)]" />
                PENGUMUMAN TERKINI
              </h3>
              <Link
                href="/dashboard/informasi"
                className="text-[10px] font-mono text-[var(--accent)] hover:underline flex items-center uppercase tracking-wider font-bold"
              >
                SEMUA <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {announcements?.length === 0 ? (
                <EmptyState
                  icon={Megaphone}
                  title="BELUM ADA PENGUMUMAN"
                  description="Informasi terbaru akan muncul di sini."
                />
              ) : (
                announcements?.map((ann) => (
                  <div
                    key={ann._id}
                    className="p-3.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all"
                  >
                    {ann.isPriority && (
                      <div className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider mb-1">
                        [PENTING]
                      </div>
                    )}
                    <div className="text-xs font-bold text-[var(--text-primary)] mb-1 line-clamp-1">
                      {ann.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {ann.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Schedule Summary */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--accent)]" />
                JADWAL TERDEKAT
              </h3>
              <Link
                href="/dashboard/informasi?tab=jadwal"
                className="text-[10px] font-mono text-[var(--accent)] hover:underline flex items-center uppercase tracking-wider font-bold"
              >
                LENGKAP <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingSchedules?.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="BELUM ADA JADWAL"
                  description="Jadwal terdekat akan muncul di sini."
                />
              ) : (
                upcomingSchedules?.map((sched) => (
                  <div
                    key={sched._id}
                    className="p-3.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex gap-3.5 items-center"
                  >
                    <div className="flex flex-col items-center justify-center p-2 bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent-glow)] rounded min-w-[54px]">
                      <span className="text-base font-mono font-bold leading-none">
                        {new Date(sched.startTime).getDate()}
                      </span>
                      <span className="text-[9px] uppercase font-mono font-bold mt-1">
                        {new Date(sched.startTime).toLocaleString('id-ID', { month: 'short' })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {sched.name}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1 flex items-center gap-1">
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Crop Dialog Modal */}
      <PhotoCropDialog
        isOpen={photoUpload.isCropOpen}
        imageSrc={photoUpload.rawImageSrc}
        onClose={photoUpload.handleCancelCrop}
        onCropComplete={photoUpload.handleCropComplete}
      />
    </div>
  );
}
